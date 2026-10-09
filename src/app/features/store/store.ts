import { DialogRef } from '@angular/cdk/dialog';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Paginated, StoreCategory, StoreProduct } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SkeletonGridComponent } from '../../shared/loading';
import { UI, UiDialogService } from '../../shared/ui';
import { apiErrorMessage, productCover, unwrapList } from './store-utils';

type StoreFilters = {
  q: string;
  category: string;
  min: string;
  max: string;
  stock: string;
  sort: string;
};

const EMPTY_FILTERS: StoreFilters = { q: '', category: '', min: '', max: '', stock: '', sort: '' };

/** Euros typed by the shopper to whole cents for the API; blank or invalid becomes ''. */
export function eurosToCents(value: string): string {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) {
    return '';
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    return '';
  }
  return String(Math.round(amount * 100));
}

@Component({
  selector: 'app-store',
  imports: [CurrencyPipe, RouterLink, SkeletonGridComponent, UI],
  templateUrl: './store.html',
  styleUrl: './store.scss',
})
export class StoreComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly dialog = inject(UiDialogService);
  private filterDialog: DialogRef | null = null;

  readonly categories = signal<StoreCategory[]>([]);
  readonly products = signal<StoreProduct[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly filters = signal<StoreFilters>({ ...EMPTY_FILTERS });
  readonly draft = signal('');
  readonly page = signal(1);
  readonly hasMore = signal(false);
  readonly cover = productCover;

  readonly filtered = computed(() => {
    const { q, category, min, max, stock } = this.filters();
    return !!(q || category || min || max || stock);
  });

  /** Modal edits stay here until the shopper presses "Show results". */
  readonly draftFilters = signal<Pick<StoreFilters, 'min' | 'max' | 'stock'>>({
    min: '',
    max: '',
    stock: '',
  });

  readonly activeFilterCount = computed(() => {
    const { min, max, stock } = this.filters();
    return [min || max, stock].filter((value) => !!value).length;
  });

  readonly activeCategory = computed(() =>
    this.categories().find((item) => item.slug === this.filters().category),
  );

  ngOnInit(): void {
    this.api.listStoreCategories().subscribe({
      next: (rows) => this.categories.set(rows),
      error: () => this.categories.set([]),
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const next: StoreFilters = {
        q: params.get('q') ?? '',
        category: params.get('category') ?? '',
        min: params.get('min') ?? '',
        max: params.get('max') ?? '',
        stock: params.get('stock') ?? '',
        sort: params.get('sort') ?? '',
      };
      this.filters.set(next);
      this.draft.set(next.q);
      this.page.set(1);
      this.load(false);
    });
  }

  search(): void {
    this.apply({ q: this.draft().trim() });
  }

  apply(patch: Partial<StoreFilters>): void {
    const next = { ...this.filters(), ...patch };
    const queryParams: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(next)) {
      queryParams[key] = value || null;
    }
    void this.router.navigate(['/store'], { queryParams });
  }

  openFilters(content: TemplateRef<unknown>): void {
    const { min, max, stock } = this.filters();
    this.draftFilters.set({ min, max, stock });
    this.filterDialog = this.dialog.open(content);
  }

  patchDraft(patch: Partial<StoreFilters>): void {
    this.draftFilters.update((current) => ({ ...current, ...patch }));
  }

  resetDraft(): void {
    this.draftFilters.set({ min: '', max: '', stock: '' });
  }

  applyFilters(): void {
    this.apply(this.draftFilters());
    this.filterDialog?.close();
  }

  clear(): void {
    void this.router.navigate(['/store']);
  }

  loadMore(): void {
    this.page.update((value) => value + 1);
    this.load(true);
  }

  addToCart(product: StoreProduct): void {
    this.cart.add(product);
  }

  private load(append: boolean): void {
    const filters = this.filters();
    if (append) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set('');
    this.api
      .listProducts({
        search: filters.q,
        category: filters.category,
        min_price_cents: eurosToCents(filters.min),
        max_price_cents: eurosToCents(filters.max),
        in_stock: filters.stock ? 'true' : '',
        ordering: filters.sort,
        page: append ? String(this.page()) : '',
      })
      .subscribe({
        next: (payload) => {
          const rows = unwrapList(payload);
          this.products.set(append ? [...this.products(), ...rows] : rows);
          const more = !Array.isArray(payload) && !!(payload as Paginated<StoreProduct>).next;
          this.hasMore.set(more);
          // Only a complete, unfiltered catalog can tell the cart a product is gone.
          if (!append && !more && !this.filtered()) {
            this.cart.reconcile(rows);
          }
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: (err) => {
          if (!append) {
            this.products.set([]);
          }
          this.loading.set(false);
          this.loadingMore.set(false);
          this.error.set(apiErrorMessage(err, 'We could not load the store right now. Please try again shortly.'));
        },
      });
  }
}
