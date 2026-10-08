import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StoreProduct } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { MediaFadeDirective, SkeletonGridComponent } from '../../shared/loading';
import { unwrapList, productCover } from './store-utils';

@Component({
  selector: 'app-store',
  imports: [CurrencyPipe, MediaFadeDirective, RouterLink, SkeletonGridComponent],
  templateUrl: './store.html',
  styleUrl: './store.scss',
})
export class StoreComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  readonly products = signal<StoreProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly cover = productCover;

  ngOnInit(): void {
    this.api.listProducts().subscribe({
      next: (payload) => {
        const products = unwrapList(payload);
        this.products.set(products);
        this.cart.reconcile(products);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
        this.error.set('Could not load the catalog. Is the API running?');
      },
    });
  }

  addToCart(product: StoreProduct): void {
    this.cart.add(product);
  }
}
