import { DatePipe } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MarketplaceSales } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonRowsComponent, SpinnerComponent } from '../../shared/loading';
import { formatMoney, marketError } from './market-utils';

@Component({
  selector: 'app-sales',
  imports: [RouterLink, DatePipe, SkeletonRowsComponent, SpinnerComponent],
  templateUrl: './sales.html',
  styleUrl: './market.scss',
})
export class SalesComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly bannerHost = viewChild<ElementRef<HTMLElement>>('bannerHost');
  private readonly onboardingHost = viewChild<ElementRef<HTMLElement>>('onboardingHost');
  private readonly managementHost = viewChild<ElementRef<HTMLElement>>('managementHost');
  private readonly payoutsHost = viewChild<ElementRef<HTMLElement>>('payoutsHost');
  private mountedKey = '';
  private mounting = false;

  readonly sales = signal<MarketplaceSales | null>(null);
  readonly publishableKey = signal('');
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly connectError = signal('');
  readonly sellerAgreed = signal(false);
  readonly money = formatMoney;

  constructor() {
    this.api.marketplaceConfig().subscribe({
      next: (config) => this.publishableKey.set(config.stripe_publishable_key),
      error: () => this.publishableKey.set(''),
    });
    this.reload();
    effect(() => {
      const desk = this.sales();
      const banner = this.bannerHost();
      const key = this.publishableKey();
      if (!this.sellerTermsAccepted() || !desk?.account.stripe_account_id || !banner || !key) {
        return;
      }
      const mountKey = `${desk.account.stripe_account_id}:${desk.account.ready}:${key}`;
      if (this.mountedKey === mountKey || this.mounting) {
        return;
      }
      this.mounting = true;
      void this.mountConnect(mountKey);
    });
  }

  reload(): void {
    this.api.getMarketplaceSales().subscribe({
      next: (desk) => {
        this.sales.set(desk);
        this.loading.set(false);
        this.busy.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.busy.set(false);
        this.error.set(marketError(err, 'Could not load sales.'));
      },
    });
  }

  startPayouts(): void {
    if (!this.sellerTermsAccepted()) {
      if (!this.sellerAgreed()) {
        this.error.set('Accept the marketplace seller terms to set up payouts.');
        return;
      }
      this.busy.set(true);
      this.error.set('');
      this.auth.acceptLegal({ seller_terms: true }).subscribe({
        next: () => {
          if (this.sales()?.account.stripe_account_id) {
            this.reload();
            return;
          }
          this.createAccount();
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(marketError(err, 'Could not save your acceptance of the seller terms.'));
        },
      });
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.createAccount();
  }

  private sellerTermsAccepted(): boolean {
    return Boolean(this.auth.currentUser()?.seller_terms_accepted_at);
  }

  private createAccount(): void {
    this.api.createMarketplaceAccount().subscribe({
      next: () => this.reload(),
      error: (err) => {
        this.busy.set(false);
        this.error.set(marketError(err, 'Could not start payout setup.'));
      },
    });
  }

  private place(
    instance: {
      create: (name: 'notification-banner' | 'account-onboarding' | 'account-management' | 'payouts') => HTMLElement & {
        setOnExit?: (listener: () => void) => void;
      };
    },
    name: 'notification-banner' | 'account-onboarding' | 'account-management' | 'payouts',
    host: ElementRef<HTMLElement> | undefined,
  ) {
    if (!host) {
      return undefined;
    }
    const node = instance.create(name);
    host.nativeElement.replaceChildren(node);
    return node;
  }

  private async mountConnect(mountKey: string): Promise<void> {
    const key = this.publishableKey();
    if (!key) {
      this.mounting = false;
      this.connectError.set('Payout setup is temporarily unavailable. Please try again later.');
      return;
    }
    try {
      const { loadConnectAndInitialize } = await import('@stripe/connect-js');
      const instance = loadConnectAndInitialize({
        publishableKey: key,
        fetchClientSecret: async () => {
          const session = await firstValueFrom(this.api.createMarketplaceAccountSession());
          return session.client_secret;
        },
        appearance: {
          overlays: 'dialog',
          variables: {
            colorPrimary: '#ff3b3b',
            colorBackground: '#10131a',
            colorText: '#f4f1ea',
            colorSecondaryText: '#9aa3b5',
            colorBorder: '#262c38',
            buttonPrimaryColorBackground: '#ff3b3b',
            buttonPrimaryColorText: '#140407',
            fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
            borderRadius: '0px',
          },
        },
      });
      const ready = this.sales()?.account.ready ?? false;
      this.place(instance, 'notification-banner', this.bannerHost());
      if (!ready) {
        const onboarding = this.place(instance, 'account-onboarding', this.onboardingHost());
        onboarding?.setOnExit?.(() => this.reload());
      }
      this.place(instance, 'account-management', this.managementHost());
      this.place(instance, 'payouts', this.payoutsHost());
      this.mountedKey = mountKey;
      this.connectError.set('');
    } catch (err) {
      this.mountedKey = '';
      this.connectError.set(marketError(err, 'Could not load payout setup.'));
    } finally {
      this.mounting = false;
    }
  }
}
