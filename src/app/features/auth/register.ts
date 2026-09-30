import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './auth-form.scss',
})
export class RegisterComponent {
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
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/verify-email']),
      error: (err: HttpErrorResponse) => {
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
