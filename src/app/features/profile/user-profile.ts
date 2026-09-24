import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StoreOrder, UserProfile } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { shippingSummary, unwrapList } from '../store/store-utils';

@Component({
  selector: 'app-user-profile',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly username = input.required<string>();
  readonly profile = signal<UserProfile | null>(null);
  readonly orders = signal<StoreOrder[]>([]);
  readonly ordersLoading = signal(false);

  readonly isOwn = computed(() => {
    const me = this.auth.currentUser()?.username;
    return Boolean(me && me === this.username());
  });

  private ordersUser = '';

  constructor() {
    effect(() => {
      if (!this.isOwn()) {
        this.orders.set([]);
        this.ordersUser = '';
        return;
      }
      const name = this.username();
      if (this.ordersUser === name) {
        return;
      }
      this.ordersUser = name;
      this.loadOrders();
    });
  }

  ngOnInit(): void {
    this.api.getProfile(this.username()).subscribe((profile) => this.profile.set(profile));
  }

  shipping = shippingSummary;

  private loadOrders(): void {
    this.ordersLoading.set(true);
    this.api.listOrders().subscribe({
      next: (payload) => {
        this.orders.set(unwrapList(payload));
        this.ordersLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.ordersLoading.set(false);
      },
    });
  }
}
