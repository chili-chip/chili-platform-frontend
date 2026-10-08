import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NewsletterService } from '../../core/services/newsletter.service';

@Component({
  selector: 'app-newsletter-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-signup.html',
  styleUrl: './newsletter-signup.scss',
})
export class NewsletterSignupComponent {
  private readonly newsletter = inject(NewsletterService);
  private readonly fb = inject(FormBuilder);

  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.error.set('Enter a valid email address.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.newsletter.subscribe(this.form.getRawValue().email).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.message.set(response.detail);
        this.form.reset();
      },
      error: (err: { status?: number; error?: { detail?: string; email?: string[] } }) => {
        this.busy.set(false);
        if (err.status === 429) {
          this.error.set('Too many attempts. Try again later.');
          return;
        }
        this.error.set(
          err.error?.email?.[0] || err.error?.detail || 'Could not subscribe right now.',
        );
      },
    });
  }
}
