import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './auth-form.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly message = signal('');
  readonly error = signal('');
  readonly devLink = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.message.set('');
    this.auth.requestPasswordReset(this.form.getRawValue().email).subscribe({
      next: (response) => {
        this.message.set(response.detail);
        this.devLink.set(response.reset_url ?? '');
      },
      error: (err: { error?: { detail?: string } }) => {
        this.error.set(err.error?.detail || 'Could not send the reset email.');
      },
    });
  }
}
