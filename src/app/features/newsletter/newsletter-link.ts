import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { NewsletterService } from '../../core/services/newsletter.service';

type LinkAction = 'confirm' | 'unsubscribe';

const COPY: Record<LinkAction, { title: string; busy: string; invalid: string }> = {
  confirm: {
    title: 'Confirm subscription',
    busy: 'Confirming…',
    invalid: 'This confirmation link is invalid or has expired.',
  },
  unsubscribe: {
    title: 'Unsubscribe',
    busy: 'Unsubscribing…',
    invalid: 'This unsubscribe link is invalid.',
  },
};

/** Handles the confirm and unsubscribe links from newsletter emails (route data `action`). */
@Component({
  selector: 'app-newsletter-link',
  imports: [RouterLink],
  templateUrl: './newsletter-link.html',
  styleUrl: '../auth/auth-form.scss',
})
export class NewsletterLinkComponent implements OnInit {
  private readonly newsletter = inject(NewsletterService);
  private readonly route = inject(ActivatedRoute);

  readonly action: LinkAction =
    this.route.snapshot.data['action'] === 'unsubscribe' ? 'unsubscribe' : 'confirm';
  readonly copy = COPY[this.action];
  readonly message = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set(this.copy.invalid);
      return;
    }
    this.busy.set(true);
    const request =
      this.action === 'unsubscribe'
        ? this.newsletter.unsubscribe(token)
        : this.newsletter.confirm(token);
    request.subscribe({
      next: (response) => {
        this.busy.set(false);
        this.message.set(response.detail);
      },
      error: (err: { error?: { detail?: string } }) => {
        this.busy.set(false);
        this.error.set(err.error?.detail || this.copy.invalid);
      },
    });
  }
}
