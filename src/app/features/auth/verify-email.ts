import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './auth-form.scss',
})
export class VerifyEmailComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly message = signal('');
  readonly error = signal('');
  readonly devLink = signal(readVerificationUrl());
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
        if (response.verification_url) {
          this.devLink.set(response.verification_url);
        }
      },
      error: (err: { error?: { detail?: string } }) => {
        this.busy.set(false);
        this.error.set(err.error?.detail || 'Could not send the verification email.');
      },
    });
  }
}

function readVerificationUrl(): string {
  const state = history.state as { verificationUrl?: string } | null;
  return state?.verificationUrl || '';
}
