import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-confirm-email-change',
  imports: [RouterLink],
  templateUrl: './confirm-email-change.html',
  styleUrl: './auth-form.scss',
})
export class ConfirmEmailChangeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly message = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('This confirmation link is invalid or has expired.');
      return;
    }
    this.busy.set(true);
    this.auth.confirmEmailChange(token).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.message.set(`Your email is now ${response.email}.`);
      },
      error: (err: { error?: { detail?: string } }) => {
        this.busy.set(false);
        this.error.set(err.error?.detail || 'This confirmation link is invalid or has expired.');
      },
    });
  }
}
