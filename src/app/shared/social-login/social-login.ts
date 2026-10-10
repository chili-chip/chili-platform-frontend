import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';

import { SocialProvider, SocialProviderId } from '../../core/models/platform';
import { AuthService } from '../../core/services/auth.service';
import { UiButton, UiNotice } from '../ui';
import { ProviderIcon } from './provider-icon';

/**
 * "Continue with GitHub / Google" on the sign-in and sign-up pages. Shows only
 * the providers the API has credentials for, and nothing at all when none.
 */
@Component({
  selector: 'app-social-login',
  imports: [UiButton, UiNotice, ProviderIcon],
  templateUrl: './social-login.html',
  styleUrl: './social-login.scss',
})
export class SocialLoginComponent implements OnInit {
  private readonly auth = inject(AuthService);

  /** Sign-up passes the terms checkbox; sign-in leaves it to the legal prompt. */
  readonly acceptTerms = input<boolean | null>(null);
  readonly next = input<string | null>(null);
  /** Fired when sign-up is tried before the terms box is ticked. */
  readonly termsRequired = output<void>();

  readonly providers = signal<SocialProvider[]>([]);
  readonly busy = signal<SocialProviderId | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.auth.socialProviders().subscribe({
      next: (providers) => this.providers.set(providers),
      error: () => this.providers.set([]),
    });
  }

  start(provider: SocialProviderId): void {
    if (this.acceptTerms() === false) {
      this.termsRequired.emit();
      return;
    }
    this.busy.set(provider);
    this.error.set('');
    this.auth
      .startSocialLogin(provider, { acceptTerms: this.acceptTerms() === true, next: this.next() })
      .subscribe({
        error: (err: HttpErrorResponse) => {
          this.busy.set(null);
          const detail = err.error?.detail;
          this.error.set(typeof detail === 'string' ? detail : 'Could not start that sign-in.');
        },
      });
  }
}
