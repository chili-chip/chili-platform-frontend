import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StoreOrder } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorMessage, shippingAddressLines, shippingStatus } from './store-utils';

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetailComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly id = input.required<string>();
  readonly paid = input<string | undefined>(undefined);

  readonly order = signal<StoreOrder | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly justPaid = computed(() => {
    const value = this.paid();
    return value === '1' || value === 'true';
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  addressLines = shippingAddressLines;
  shippingStatus = shippingStatus;

  private load(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.order.set(null);
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Could not load this order.'));
      },
    });
  }
}
