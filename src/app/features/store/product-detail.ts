import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { StoreDeliveryOption, StoreProduct } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { MediaFadeDirective, SkeletonDetailComponent } from '../../shared/loading';
import { MarkdownComponent } from '../../shared/markdown';
import {
  filledStars,
  RatingFormComponent,
  RatingSubmit,
  ratingSummary,
  ReviewListComponent,
} from '../../shared/ratings';
import { UI } from '../../shared/ui';
import { apiErrorMessage, productBlurb, productCover, productImages } from './store-utils';

@Component({
  selector: 'app-product-detail',
  imports: [
    UI,
    CurrencyPipe,
    MarkdownComponent,
    MediaFadeDirective,
    RatingFormComponent,
    ReviewListComponent,
    RouterLink,
    SkeletonDetailComponent,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent {
  private readonly api = inject(ApiService);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  readonly slug = input.required<string>();
  readonly product = signal<StoreProduct | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal(0);
  readonly deliveryOptions = signal<StoreDeliveryOption[]>([]);
  readonly savingRating = signal(false);
  readonly ratingError = signal('');
  readonly filledStars = filledStars;

  /** Names of the delivery options this product ships with. */
  readonly shipsWith = computed(() => {
    const product = this.product();
    if (!product || product.is_digital) {
      return [];
    }
    const limits = product.delivery_options ?? [];
    return this.deliveryOptions()
      .filter((option) => !limits.length || limits.includes(option.slug))
      .map((option) => option.name);
  });

  readonly blurb = computed(() => {
    const product = this.product();
    return product ? productBlurb(product) : '';
  });
  readonly gallery = computed(() => productImages(this.product()));
  readonly cover = computed(() => this.gallery()[this.selected()] || productCover(this.product()));

  constructor() {
    this.api.listDeliveryOptions().subscribe({
      next: (rows) => this.deliveryOptions.set(rows),
      error: () => undefined,
    });
    effect(() => {
      const slug = this.slug();
      untracked(() => this.load(slug));
    });
  }

  addToCart(): void {
    const product = this.product();
    if (product) {
      this.cart.add(product);
    }
  }

  ratingSummary(product: StoreProduct): string {
    if (!product.rating_count) {
      return 'No ratings yet';
    }
    return ratingSummary(product.rating_average ?? null, product.rating_count);
  }

  signInToRate(): void {
    void this.router.navigate(['/login'], { queryParams: { next: `/store/${this.slug()}` } });
  }

  rate(product: StoreProduct, { stars, comment }: RatingSubmit): void {
    if (this.savingRating()) {
      return;
    }
    this.savingRating.set(true);
    this.ratingError.set('');
    this.api.rateProduct(product.slug, stars, comment).subscribe({
      next: (updated) => {
        this.product.set(updated);
        this.savingRating.set(false);
        this.toast.success('Thanks, your rating was saved.');
      },
      error: (err) => {
        this.savingRating.set(false);
        const message = apiErrorMessage(err, 'Could not save your rating.');
        this.ratingError.set(message);
        this.toast.error(message);
      },
    });
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.error.set('');
    this.product.set(null);
    this.api.getProduct(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.selected.set(0);
        this.title.setTitle(`${product.name} · Chilichip Store`);
        this.loading.set(false);
      },
      error: (err) => {
        this.product.set(null);
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Could not load this product.'));
      },
    });
  }
}
