import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { GameProject, MarketplaceCategory } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonRowsComponent } from '../../shared/loading';
import { MarkdownEditorComponent } from '../../shared/markdown-editor';
import { UI } from '../../shared/ui';
import { dollarsToCents, marketError } from '../marketplace/market-utils';
import { unwrapList } from '../store/store-utils';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-listing',
  imports: [UI, MarkdownEditorComponent, RouterLink, SkeletonRowsComponent],
  templateUrl: './listing.html',
  styleUrl: './listing.scss',
})
export class ListingComponent {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly username = input.required<string>();
  private readonly query = toSignal(this.route.queryParamMap);

  readonly games = signal<GameProject[]>([]);
  readonly categories = signal<MarketplaceCategory[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly price = signal('1.00');
  readonly free = signal(false);
  readonly category = signal('puzzle');
  readonly tags = signal('');
  readonly description = signal('');
  readonly sellerAgreed = signal(false);

  readonly gameId = computed(() => Number(this.query()?.get('game') || 0));
  readonly selected = computed(() => this.games().find((game) => game.id === this.gameId()) ?? null);

  private filledSlug = '';
  private loadedUser = '';

  constructor() {
    this.api.listMarketplaceCategories().subscribe({
      next: (rows) => {
        this.categories.set(rows);
        if (rows[0] && !rows.some((row) => row.slug === this.category())) {
          this.category.set(rows[0].slug);
        }
      },
      error: () => this.categories.set([]),
    });

    effect(() => {
      const name = this.username();
      const me = this.auth.currentUser()?.username;
      if (!name || !me || me === name) {
        return;
      }
      void this.router.navigate(['/profile', name], { replaceUrl: true });
    });

    effect(() => {
      const name = this.username();
      const me = this.auth.currentUser()?.username;
      if (!name || !me || me !== name || this.loadedUser === name) {
        return;
      }
      this.loadedUser = name;
      this.reload(name);
    });

    effect(() => {
      const game = this.selected();
      if (!game) {
        this.filledSlug = '';
        return;
      }
      if (!game.listing_slug) {
        if (this.filledSlug) {
          this.resetForm();
        }
        return;
      }
      if (this.filledSlug === game.listing_slug) {
        return;
      }
      this.filledSlug = game.listing_slug;
      this.api.getMarketplaceListing(game.listing_slug).subscribe({
        next: (listing) => {
          this.price.set((listing.price_cents / 100).toFixed(2));
          this.free.set(listing.price_cents === 0);
          this.category.set(listing.category.slug);
          this.tags.set(listing.tags.join(', '));
          this.description.set(listing.description);
        },
        error: (err) => this.error.set(marketError(err, 'Could not open this listing.')),
      });
    });
  }

  pick(id: number): void {
    void this.router.navigate(['/profile', this.username(), 'listing'], {
      queryParams: { game: id || null },
    });
  }

  save(): void {
    const game = this.selected();
    if (!game) {
      this.error.set('Choose a released game.');
      return;
    }
    const cents = this.free() ? 0 : dollarsToCents(this.price());
    if (cents === null || (cents !== 0 && cents < 100)) {
      this.error.set('Paid games must cost at least €1. Free listings are allowed.');
      return;
    }
    const body = {
      price_cents: cents,
      category: this.category(),
      description: this.description().trim(),
      tags: this.tags()
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    const creating = !game.listing_slug;
    if (creating && !this.sellerTermsAccepted()) {
      if (!this.sellerAgreed()) {
        this.error.set('Accept the marketplace seller terms before listing a game.');
        return;
      }
      this.busy.set(true);
      this.error.set('');
      this.auth.acceptLegal({ seller_terms: true }).subscribe({
        next: () => this.persistListing(game, body),
        error: (err) => {
          this.busy.set(false);
          this.error.set(marketError(err, 'Could not save your acceptance of the seller terms.'));
        },
      });
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.persistListing(game, body);
  }

  private sellerTermsAccepted(): boolean {
    return Boolean(this.auth.currentUser()?.seller_terms_accepted_at);
  }

  private persistListing(
    game: GameProject,
    body: { price_cents: number; category: string; description: string; tags: string[] },
  ): void {
    const request = game.listing_slug
      ? this.api.updateMarketplaceListing(game.listing_slug, body)
      : this.api.createMarketplaceListing({ game: game.id, ...body });
    request.subscribe({
      next: () => {
        this.toast.success(game.listing_slug ? 'Listing updated.' : 'Game listed in the marketplace.');
        this.filledSlug = '';
        this.reload(this.username());
      },
      error: (err) => {
        this.busy.set(false);
        const message = marketError(err, 'Could not save this listing.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  unlist(): void {
    const slug = this.selected()?.listing_slug;
    if (!slug) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api.deleteMarketplaceListing(slug).subscribe({
      next: () => {
        this.toast.success('Game unlisted.');
        this.resetForm();
        this.reload(this.username());
      },
      error: (err) => {
        this.busy.set(false);
        const message = marketError(err, 'Could not unlist that game.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  private reload(username: string): void {
    this.loading.set(true);
    this.api.listGames(username).subscribe({
      next: (payload) => {
        this.games.set(unwrapList(payload));
        this.loading.set(false);
        this.busy.set(false);
      },
      error: (err) => {
        this.games.set([]);
        this.loading.set(false);
        this.busy.set(false);
        this.error.set(marketError(err, 'Could not load your games.'));
      },
    });
  }

  private resetForm(): void {
    this.filledSlug = '';
    this.price.set('1.00');
    this.free.set(false);
    this.tags.set('');
    this.description.set('');
  }
}
