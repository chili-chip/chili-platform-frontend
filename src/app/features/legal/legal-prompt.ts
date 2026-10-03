import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-legal-prompt',
  imports: [RouterLink],
  templateUrl: './legal-prompt.html',
  styleUrl: './legal-prompt.scss',
})
export class LegalPromptComponent {
  private readonly auth = inject(AuthService);

  readonly agreed = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  submit(): void {
    if (!this.agreed()) {
      this.error.set('Accept the terms of service and privacy policy to continue.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.acceptLegal({ terms: true }).subscribe({
      next: () => this.busy.set(false),
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        const detail = err.error?.detail;
        this.error.set(typeof detail === 'string' ? detail : 'Could not save that acceptance.');
      },
    });
  }
}
