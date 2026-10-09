import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UI } from '../../shared/ui';

@Component({
  selector: 'app-verify-email',
  imports: [UI, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './auth-form.scss',
})
export class VerifyEmailComponent implements OnInit {
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly message = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  ngOnInit(): void {
    const uid = this.route.snapshot.queryParamMap.get('uid');
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!uid || !token) {
      return;
    }
    this.busy.set(true);
    this.auth.verifyEmail(uid, token).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Email verified. You can post, publish, and check out.');
        this.toast.success('Email verified.');
        this.error.set('');
        if (this.auth.isAuthenticated()) {
          this.auth.refreshProfile().subscribe({ error: () => undefined });
        }
      },
      error: () => {
        this.busy.set(false);
        this.error.set('This verification link is invalid or has expired.');
      },
    });
  }

  resend(): void {
    this.busy.set(true);
    this.error.set('');
    this.auth.resendVerification().subscribe({
      next: (response) => {
        this.busy.set(false);
        this.message.set(response.detail);
        this.toast.success('Verification email sent.');
      },
      error: (err: { error?: { detail?: string } }) => {
        this.busy.set(false);
        this.error.set(err.error?.detail || 'Could not send the verification email.');
      },
    });
  }
}
