import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameProject, StoreOrder, UserProfile } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { shippingSummary, unwrapList } from '../store/store-utils';

@Component({
  selector: 'app-user-profile',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfileComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly username = input.required<string>();
  readonly profile = signal<UserProfile | null>(null);
  readonly games = signal<GameProject[]>([]);
  readonly gamesLoading = signal(false);
  readonly orders = signal<StoreOrder[]>([]);
  readonly ordersLoading = signal(false);

  readonly isOwn = computed(() => {
    const me = this.auth.currentUser()?.username;
    return Boolean(me && me === this.username());
  });

  private ordersUser = '';
  private gamesUser = '';

  constructor() {
    effect(() => {
      const name = this.username();
      if (!name || this.gamesUser === name) {
        return;
      }
      this.gamesUser = name;
      this.profile.set(null);
      this.api.getProfile(name).subscribe((profile) => this.profile.set(profile));
      this.loadGames(name);
    });

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

  shipping = shippingSummary;

  removeGame(game: GameProject, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Remove “${game.title}” from your profile?`)) {
      return;
    }
    this.api.deleteGame(game.id).subscribe({
      next: () => this.games.update((list) => list.filter((item) => item.id !== game.id)),
    });
  }

  private loadGames(username: string): void {
    this.gamesLoading.set(true);
    this.api.listGames(username).subscribe({
      next: (payload) => {
        this.games.set(unwrapList(payload));
        this.gamesLoading.set(false);
      },
      error: () => {
        this.games.set([]);
        this.gamesLoading.set(false);
      },
    });
  }

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
