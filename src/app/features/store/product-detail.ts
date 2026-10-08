import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { marked } from 'marked';

import { StoreProduct } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { MediaFadeDirective, SkeletonDetailComponent } from '../../shared/loading';
import { apiErrorMessage, productBlurb, productCover, productImages } from './store-utils';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, MediaFadeDirective, RouterLink, SkeletonDetailComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent {
  private readonly api = inject(ApiService);
  private readonly title = inject(Title);
  readonly cart = inject(CartService);

  readonly slug = input.required<string>();
  readonly product = signal<StoreProduct | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal(0);

  readonly blurb = computed(() => {
    const product = this.product();
    return product ? productBlurb(product) : '';
  });
  readonly longHtml = computed(() => {
    const text = (this.product()?.long_description || '').trim();
    return text ? marked.parse(text, { async: false }) : '';
  });
  readonly gallery = computed(() => productImages(this.product()));
  readonly cover = computed(() => this.gallery()[this.selected()] || productCover(this.product()));

  constructor() {
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
