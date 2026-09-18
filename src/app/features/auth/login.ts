import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './auth-form.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => void this.router.navigate(['/community']),
      error: () => this.error.set('Could not sign in with those credentials.'),
    });
  }
}
