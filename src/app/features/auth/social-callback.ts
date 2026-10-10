import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SocialProviderId } from '../../core/models/platform';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SpinnerComponent } from '../../shared/loading';
import { UI } from '../../shared/ui';

const LABELS: Record<SocialProviderId, string> = { github: 'GitHub', google: 'Google' };

/**
 * GitHub or Google sends the browser back here with `code` and `state`. The
 * state must be the one this browser started with, so nobody can finish a
 * sign-in they started into someone else's browser.
 */
@Component({
  selector: 'app-social-callback',
  imports: [UI, RouterLink, SpinnerComponent],
  templateUrl: './social-callback.html',
  styleUrl: './auth-form.scss',
})
export class SocialCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly linking = signal(false);
  readonly label = signal('');

  ngOnInit(): void {
    const provider = this.route.snapshot.paramMap.get('provider') as SocialProviderId;
    const query = this.route.snapshot.queryParamMap;
    const pending = this.auth.takePendingSocialLogin();
    this.label.set(LABELS[provider] ?? 'the provider');
    this.linking.set(pending?.link ?? false);

    if (query.get('error')) {
      // The person pressed Cancel at the provider, or the provider refused.
      this.error.set(`${this.label()} sign-in was cancelled.`);
      return;
    }
    const code = query.get('code');
    const state = query.get('state');
    if (!code || !state || !pending || pending.provider !== provider || pending.state !== state) {
      this.error.set('This sign-in link is invalid or was opened in another browser. Please try again.');
      return;
    }

    this.auth.finishSocialLogin(provider, code, state).subscribe({
      next: (result) => {
        if (result.linked) {
          this.toast.success(`${this.label()} connected.`);
          void this.router.navigateByUrl('/settings#connected');
          return;
        }
        this.toast.success(result.created ? 'Account created. Welcome!' : 'Signed in.');
        void this.router.navigateByUrl(pending.next ?? '/community');
      },
      error: (err: HttpErrorResponse) => {
        const detail = err.error?.detail;
        this.error.set(
          typeof detail === 'string' ? detail : `Could not sign in with ${this.label()}.`,
        );
      },
    });
  }
}
