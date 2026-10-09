import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UI } from '../../shared/ui';

@Component({
  selector: 'app-register',
  imports: [UI, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './auth-form.scss',
})
export class RegisterComponent {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly next = this.route.snapshot.queryParamMap.get('next');
  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    bio: [''],
    acceptTerms: [false, Validators.requiredTrue],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.acceptTerms.invalid) {
        this.error.set('Accept the terms of service and privacy policy to create an account.');
      }
      return;
    }
    this.error.set('');
    const value = this.form.getRawValue();
    this.auth
      .register({
        username: value.username,
        email: value.email,
        password: value.password,
        bio: value.bio,
        accept_terms: value.acceptTerms,
      })
      .subscribe({
        next: () => {
          this.toast.success('Account created. Check your email to verify it.');
          void this.router.navigate(['/verify-email']);
        },
        error: (err: HttpErrorResponse) => {
          const accepted = err.error?.accept_terms;
          if (Array.isArray(accepted) && typeof accepted[0] === 'string') {
            this.error.set(accepted.join(' '));
            return;
          }
          const password = err.error?.password;
          if (Array.isArray(password) && typeof password[0] === 'string') {
            this.error.set(password.join(' '));
            return;
          }
          const detail = err.error?.detail;
          this.error.set(
            typeof detail === 'string'
              ? detail
              : 'Registration failed. Try a different username or email.',
          );
        },
      });
  }
}
