import { DatePipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  MarketplaceCategory,
  MarketplaceSales,
} from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { dollarsToCents, formatMoney, formatPrice, marketError } from './market-utils';

@Component({
  selector: 'app-sales',
  imports: [RouterLink, DatePipe],
  templateUrl: './sales.html',
  styleUrl: './market.scss',
})
export class SalesComponent {
  private readonly api = inject(ApiService);
  private readonly bannerHost = viewChild<ElementRef<HTMLElement>>('bannerHost');
  private readonly onboardingHost = viewChild<ElementRef<HTMLElement>>('onboardingHost');
  private readonly managementHost = viewChild<ElementRef<HTMLElement>>('managementHost');
  private readonly payoutsHost = viewChild<ElementRef<HTMLElement>>('payoutsHost');
  private mountedKey = '';
  private mounting = false;

  readonly sales = signal<MarketplaceSales | null>(null);
  readonly categories = signal<MarketplaceCategory[]>([]);
  readonly publishableKey = signal('');
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly connectError = signal('');
  readonly gameId = signal(0);
  readonly price = signal('1.00');
  readonly free = signal(false);
  readonly category = signal('puzzle');
  readonly tags = signal('');
  readonly description = signal('');
  readonly money = formatMoney;
  readonly priceLabel = formatPrice;
  readonly unlisted = computed(() => (this.sales()?.games ?? []).filter((game) => !game.listing_slug));

  constructor() {
    this.api.listMarketplaceCategories().subscribe({
      next: (rows) => {
        this.categories.set(rows);
        if (rows[0] && !rows.some((row) => row.slug === this.category())) {
          this.category.set(rows[0].slug);
        }
      },
      error: () => this.categories.set([]),
    });
    this.api.marketplaceConfig().subscribe({
      next: (config) => this.publishableKey.set(config.stripe_publishable_key),
      error: () => this.publishableKey.set(''),
    });
    this.reload();
    effect(() => {
      const desk = this.sales();
      const banner = this.bannerHost();
      const key = this.publishableKey();
      if (!desk?.account.stripe_account_id || !banner || !key) {
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
    this.busy.set(true);
    this.error.set('');
    this.api.createMarketplaceAccount().subscribe({
      next: () => this.reload(),
      error: (err) => {
        this.busy.set(false);
        this.error.set(marketError(err, 'Could not start payout setup.'));
      },
    });
  }

  listGame(): void {
    const cents = this.free() ? 0 : dollarsToCents(this.price());
    if (!this.gameId()) {
      this.error.set('Choose a saved game.');
      return;
    }
    if (cents === null || (cents !== 0 && cents < 100)) {
      this.error.set('Paid games must cost at least $1. Free listings are allowed.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api
      .createMarketplaceListing({
        game: this.gameId(),
        price_cents: cents,
        category: this.category(),
        description: this.description().trim(),
        tags: this.tags()
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      .subscribe({
        next: () => {
          this.description.set('');
          this.tags.set('');
          this.reload();
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(marketError(err, 'Could not list that game.'));
        },
      });
  }

  unlist(slug: string): void {
    this.busy.set(true);
    this.api.deleteMarketplaceListing(slug).subscribe({
      next: () => this.reload(),
      error: (err) => {
        this.busy.set(false);
        this.error.set(marketError(err, 'Could not unlist that game.'));
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
      this.connectError.set('Add STRIPE_PUBLISHABLE_KEY to show payout setup.');
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
