import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceTag,
} from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { GameTileComponent } from '../../shared/game-tile/game-tile';
import { formatPrice, marketError } from './market-utils';

@Component({
  selector: 'app-marketplace',
  imports: [GameTileComponent, RouterLink, SkeletonGridComponent],
  templateUrl: './marketplace.html',
  styleUrl: './market.scss',
})
export class MarketplaceComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  readonly categories = signal<MarketplaceCategory[]>([]);
  readonly tags = signal<MarketplaceTag[]>([]);
  readonly listings = signal<MarketplaceListing[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly q = signal('');
  readonly draft = signal('');
  readonly category = signal('');
  readonly tag = signal('');
  readonly price = signal('');
  readonly sort = signal('new');
  readonly page = signal(1);
  readonly hasMore = signal(false);
  readonly priceLabel = formatPrice;

  ngOnInit(): void {
    this.api.listMarketplaceCategories().subscribe({
      next: (rows) => this.categories.set(rows),
      error: () => this.categories.set([]),
    });
    this.api.listMarketplaceTags().subscribe({
      next: (rows) => this.tags.set(rows),
      error: () => this.tags.set([]),
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.q.set(params.get('q') ?? '');
      this.draft.set(this.q());
      this.category.set(params.get('category') ?? '');
      this.tag.set(params.get('tag') ?? '');
      this.price.set(params.get('price') ?? '');
      this.sort.set(params.get('sort') ?? 'new');
      this.page.set(1);
      this.load(false);
    });
  }

  search(): void {
    this.apply({ q: this.draft().trim() });
  }

  apply(patch: Record<string, string>): void {
    const next = {
      q: this.q(),
      category: this.category(),
      tag: this.tag(),
      price: this.price(),
      sort: this.sort() === 'new' ? '' : this.sort(),
      ...patch,
    };
    const queryParams: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(next)) {
      queryParams[key] = value || null;
    }
    void this.router.navigate(['/marketplace'], { queryParams });
  }

  loadMore(): void {
    this.page.update((value) => value + 1);
    this.load(true);
  }

  private load(append: boolean): void {
    this.loading.set(!append);
    this.error.set('');
    const query: Record<string, string> = {
      q: this.q(),
      category: this.category(),
      tag: this.tag(),
      price: this.price(),
      sort: this.sort(),
      page: String(this.page()),
    };
    this.api.listMarketplaceListings(query).subscribe({
      next: (payload) => {
        const rows = payload.results ?? [];
        this.listings.set(append ? [...this.listings(), ...rows] : rows);
        this.hasMore.set(!!payload.next);
        this.loading.set(false);
      },
      error: (err) => {
        if (!append) {
          this.listings.set([]);
        }
        this.loading.set(false);
        this.error.set(marketError(err, 'Could not load the marketplace.'));
      },
    });
  }
}
