import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { GameProject, MarketplacePurchase, StoreOrder, UserProfile } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { GameTileComponent } from '../../shared/game-tile/game-tile';
import { SkeletonGridComponent, SkeletonRowsComponent } from '../../shared/loading';
import { formatPrice, marketError } from '../marketplace/market-utils';
import { shippingSummary, unwrapList } from '../store/store-utils';

type ProfileTab = 'orders' | 'library' | 'projects';
type LibraryShelf = 'bought' | 'mine';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-profile',
  imports: [
    CurrencyPipe,
    DatePipe,
    GameTileComponent,
    RouterLink,
    SkeletonGridComponent,
    SkeletonRowsComponent,
    TitleCasePipe,
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfileComponent {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly username = input.required<string>();
  private readonly query = toSignal(this.route.queryParamMap);

  readonly profile = signal<UserProfile | null>(null);
  readonly games = signal<GameProject[]>([]);
  readonly projects = signal<GameProject[]>([]);
  readonly purchases = signal<MarketplacePurchase[]>([]);
  readonly gamesLoading = signal(false);
  readonly orders = signal<StoreOrder[]>([]);
  readonly ordersLoading = signal(false);
  readonly libraryLoading = signal(false);
  readonly error = signal('');
  readonly priceLabel = formatPrice;

  readonly isOwn = computed(() => {
    const me = this.auth.currentUser()?.username;
    return Boolean(me && me === this.username());
  });

  readonly tab = computed<ProfileTab>(() => {
    const value = this.query()?.get('tab');
    if (value === 'library' || value === 'projects' || value === 'orders') {
      return value;
    }
    return 'orders';
  });

  readonly shelf = computed<LibraryShelf>(() => (this.query()?.get('shelf') === 'mine' ? 'mine' : 'bought'));

  private profileUser = '';
  private panelKey = '';
  private generation = 0;

  constructor() {
    effect(() => {
      const name = this.username();
      if (!name || this.profileUser === name) {
        return;
      }
      this.profileUser = name;
      this.profile.set(null);
      this.api.getProfile(name).subscribe((profile) => {
        if (this.username() === name) {
          this.profile.set(profile);
        }
      });
    });

    effect(() => {
      const name = this.username();
      const own = this.isOwn();
      const tab = this.tab();
      const shelf = this.shelf();
      const key = own ? `${name}:${tab}:${shelf}` : `${name}:public`;
      if (!name || this.panelKey === key) {
        return;
      }
      this.panelKey = key;
      this.error.set('');
      const ticket = ++this.generation;
      if (!own) {
        this.loadReleased(name, ticket);
        return;
      }
      if (tab === 'orders') {
        this.loadOrders(ticket);
      } else if (tab === 'projects') {
        this.loadProjects(name, ticket);
      } else if (shelf === 'mine') {
        this.loadReleased(name, ticket);
      } else {
        this.loadBought(ticket);
      }
    });
  }

  shipping = shippingSummary;

  selectTab(tab: ProfileTab): void {
    void this.router.navigate(['/profile', this.username()], {
      queryParams: { tab, shelf: tab === 'library' ? this.shelf() : null },
    });
  }

  selectShelf(shelf: LibraryShelf): void {
    void this.router.navigate(['/profile', this.username()], {
      queryParams: { tab: 'library', shelf },
    });
  }

  release(game: GameProject): void {
    const proceed = confirm(
      `Release “${game.title}”? It becomes a game you can sell. The Bitsy file stays. Listing it is a separate step.`,
    );
    if (!proceed) {
      return;
    }
    this.error.set('');
    this.api.releaseGame(game.id).subscribe({
      next: () => {
        this.projects.update((list) => list.filter((item) => item.id !== game.id));
        this.toast.success(`Released ${game.title}.`);
      },
      error: (err) => {
        const message = marketError(err, 'Could not release this project.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  removeGame(game: GameProject, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Remove “${game.title}” from your profile?`)) {
      return;
    }
    this.api.deleteGame(game.id).subscribe({
      next: () => {
        this.projects.update((list) => list.filter((item) => item.id !== game.id));
        this.toast.success(`Removed ${game.title}.`);
      },
      error: (err) => this.toast.error(marketError(err, 'Could not remove this game.')),
    });
  }

  private loadReleased(username: string, ticket: number): void {
    this.gamesLoading.set(true);
    this.api.listGames(username).subscribe({
      next: (payload) => {
        if (ticket !== this.generation) {
          return;
        }
        this.games.set(unwrapList(payload));
        this.gamesLoading.set(false);
      },
      error: () => {
        if (ticket !== this.generation) {
          return;
        }
        this.games.set([]);
        this.gamesLoading.set(false);
      },
    });
  }

  private loadProjects(username: string, ticket: number): void {
    this.gamesLoading.set(true);
    this.api.listGames(username, { released: false }).subscribe({
      next: (payload) => {
        if (ticket !== this.generation) {
          return;
        }
        this.projects.set(unwrapList(payload));
        this.gamesLoading.set(false);
      },
      error: () => {
        if (ticket !== this.generation) {
          return;
        }
        this.projects.set([]);
        this.gamesLoading.set(false);
      },
    });
  }

  private loadBought(ticket: number): void {
    this.libraryLoading.set(true);
    this.api.listLibrary().subscribe({
      next: (payload) => {
        if (ticket !== this.generation) {
          return;
        }
        this.purchases.set(payload.results ?? []);
        this.libraryLoading.set(false);
      },
      error: (err) => {
        if (ticket !== this.generation) {
          return;
        }
        this.purchases.set([]);
        this.libraryLoading.set(false);
        this.error.set(marketError(err, 'Could not load your library.'));
      },
    });
  }

  private loadOrders(ticket: number): void {
    this.ordersLoading.set(true);
    this.api.listOrders().subscribe({
      next: (payload) => {
        if (ticket !== this.generation) {
          return;
        }
        this.orders.set(unwrapList(payload));
        this.ordersLoading.set(false);
      },
      error: () => {
        if (ticket !== this.generation) {
          return;
        }
        this.orders.set([]);
        this.ordersLoading.set(false);
      },
    });
  }
}
