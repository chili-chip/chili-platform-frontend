import { computed, Injectable, signal } from '@angular/core';

import { CartLine, StoreProduct } from '../models/platform';

const STORAGE_KEY = 'chili.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartLine[]>(this.read());
  readonly count = computed(() => this.items().reduce((sum, line) => sum + line.quantity, 0));
  readonly totalCents = computed(() =>
    this.items().reduce((sum, line) => sum + line.product.price_cents * line.quantity, 0),
  );
  readonly currency = computed(() => this.items()[0]?.product.currency || 'usd');
  readonly open = signal(false);

  toggle(): void {
    this.open.update((value) => !value);
  }

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }

  add(product: StoreProduct, quantity = 1): void {
    if (product.stock < 1 || quantity < 1) {
      return;
    }
    this.items.update((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (!existing) {
        return [...current, { product, quantity: Math.min(quantity, product.stock) }];
      }
      return current.map((line) =>
        line.product.id === product.id
          ? { product, quantity: Math.min(line.quantity + quantity, product.stock) }
          : line,
      );
    });
    this.persist();
    this.show();
  }

  setQuantity(productId: number, quantity: number): void {
    this.items.update((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) {
            return line;
          }
          return { ...line, quantity: Math.min(Math.max(quantity, 0), line.product.stock) };
        })
        .filter((line) => line.quantity > 0),
    );
    this.persist();
  }

  remove(productId: number): void {
    this.items.update((current) => current.filter((line) => line.product.id !== productId));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  reconcile(products: StoreProduct[]): void {
    const byId = new Map(products.map((product) => [product.id, product]));
    this.items.update((current) =>
      current
        .map((line) => {
          const product = byId.get(line.product.id);
          if (!product || !product.is_active || product.stock < 1) {
            return null;
          }
          return { product, quantity: Math.min(line.quantity, product.stock) };
        })
        .filter((line): line is CartLine => line !== null),
    );
    this.persist();
  }

  checkoutPayload(): { product: number; quantity: number }[] {
    return this.items().map((line) => ({ product: line.product.id, quantity: line.quantity }));
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
  }

  private read(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as CartLine[];
      return Array.isArray(parsed) ? parsed.filter((line) => line?.product && line.quantity > 0) : [];
    } catch {
      return [];
    }
  }
}
