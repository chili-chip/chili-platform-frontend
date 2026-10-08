import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './auth-form.scss',
})
export class ResetPasswordComponent {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly message = signal('');
  readonly error = signal('');
  readonly uid = this.route.snapshot.queryParamMap.get('uid') ?? '';
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.uid || !this.token) {
      this.error.set('This reset link is missing a token.');
      return;
    }
    const { password, confirm } = this.form.getRawValue();
    if (password !== confirm) {
      this.error.set('Those passwords do not match.');
      return;
    }
    this.error.set('');
    this.auth.confirmPasswordReset({ uid: this.uid, token: this.token, password }).subscribe({
      next: (response) => {
        this.message.set(response.detail);
        this.toast.success('Password updated. You can sign in now.');
      },
      error: (err: { error?: { detail?: string; password?: string[] } }) => {
        const passwordError = err.error?.password;
        if (Array.isArray(passwordError) && passwordError.length) {
          this.error.set(passwordError.join(' '));
          return;
        }
        this.error.set(err.error?.detail || 'Could not reset the password.');
      },
    });
  }
}
