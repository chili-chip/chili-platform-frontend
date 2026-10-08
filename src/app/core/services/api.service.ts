import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  ForumCategory,
  ForumComment,
  ForumPost,
  GameProject,
  Paginated,
  MarketplaceAccount,
  MarketplaceAccountSession,
  MarketplaceCategory,
  MarketplaceCheckout,
  MarketplaceConfig,
  MarketplaceListing,
  MarketplacePurchase,
  MarketplaceSales,
  MarketplaceTag,
  StoreCategory,
  StoreCheckoutSession,
  StoreOrder,
  StoreProduct,
  UserProfile,
  UserSettings,
} from '../models/platform';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getSettings() {
    return this.http.get<UserSettings>(`${this.base}/profiles/me/settings/`);
  }

  updateSettings(payload: Partial<UserSettings>) {
    return this.http.patch<UserSettings>(`${this.base}/profiles/me/settings/`, payload);
  }

  listCategories() {
    return this.http.get<Paginated<ForumCategory> | ForumCategory[]>(
      `${this.base}/forum/categories/`,
    );
  }

  listPosts(category?: string) {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<Paginated<ForumPost>>(`${this.base}/forum/posts/`, { params });
  }

  getPost(id: string | number) {
    return this.http.get<ForumPost>(`${this.base}/forum/posts/${id}/`);
  }

  createPost(payload: { title: string; content: string; category: number }) {
    return this.http.post<ForumPost>(`${this.base}/forum/posts/`, payload);
  }

  listComments(postId: string | number) {
    return this.http.get<ForumComment[]>(`${this.base}/forum/posts/${postId}/comments/`);
  }

  createComment(postId: number, content: string) {
    return this.http.post<ForumComment>(`${this.base}/forum/posts/${postId}/comments/`, {
      content,
    });
  }

  getProfile(username: string) {
    return this.http.get<UserProfile>(`${this.base}/profiles/${username}/`);
  }

  listGames(username: string, options?: { released?: boolean }) {
    let params = new HttpParams().set('username', username);
    if (options?.released === false) {
      params = params.set('released', 'false');
    }
    return this.http.get<Paginated<GameProject> | GameProject[]>(`${this.base}/games/`, { params });
  }

  releaseGame(id: number | string) {
    return this.http.post<GameProject>(`${this.base}/games/${id}/release/`, {});
  }

  getGame(id: number | string) {
    return this.http.get<GameProject>(`${this.base}/games/${id}/`);
  }

  deleteGame(id: number | string) {
    return this.http.delete(`${this.base}/games/${id}/`);
  }

  saveGame(payload: { title: string; data: string }, id?: number | null) {
    if (id) {
      return this.http.put<GameProject>(`${this.base}/games/${id}/`, payload);
    }
    return this.http.post<GameProject>(`${this.base}/games/`, payload);
  }

  listProducts(query: Record<string, string> = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<Paginated<StoreProduct> | StoreProduct[]>(`${this.base}/store/products/`, {
      params,
    });
  }

  listStoreCategories() {
    return this.http.get<StoreCategory[]>(`${this.base}/store/categories/`);
  }

  getProduct(slug: string) {
    return this.http.get<StoreProduct>(`${this.base}/store/products/${slug}/`);
  }

  createCheckout(items: { product: number; quantity: number }[]) {
    return this.http.post<StoreCheckoutSession>(`${this.base}/store/checkout/`, { items });
  }

  confirmCheckout(sessionId: string) {
    return this.http.post<StoreOrder>(`${this.base}/store/checkout/confirm/`, {
      session_id: sessionId,
    });
  }

  listOrders() {
    return this.http.get<Paginated<StoreOrder> | StoreOrder[]>(`${this.base}/store/orders/`);
  }

  getOrder(id: string | number) {
    return this.http.get<StoreOrder>(`${this.base}/store/orders/${id}/`);
  }

  marketplaceConfig() {
    return this.http.get<MarketplaceConfig>(`${this.base}/marketplace/config/`);
  }

  listMarketplaceCategories() {
    return this.http.get<MarketplaceCategory[]>(`${this.base}/marketplace/categories/`);
  }

  listMarketplaceTags() {
    return this.http.get<MarketplaceTag[]>(`${this.base}/marketplace/tags/`);
  }

  listMarketplaceListings(query: Record<string, string> = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<Paginated<MarketplaceListing>>(`${this.base}/marketplace/listings/`, {
      params,
    });
  }

  getMarketplaceListing(slug: string) {
    return this.http.get<MarketplaceListing>(`${this.base}/marketplace/listings/${slug}/`);
  }

  rateMarketplaceListing(slug: string, stars: number, comment = '') {
    return this.http.post<MarketplaceListing>(`${this.base}/marketplace/listings/${slug}/rating/`, {
      stars,
      comment,
    });
  }

  createMarketplaceListing(body: {
    game: number;
    price_cents: number;
    category: string;
    description?: string;
    tags?: string[];
  }) {
    return this.http.post<MarketplaceListing>(`${this.base}/marketplace/listings/`, body);
  }

  updateMarketplaceListing(
    slug: string,
    body: { price_cents?: number; category?: string; description?: string; tags?: string[]; published?: boolean },
  ) {
    return this.http.patch<MarketplaceListing>(`${this.base}/marketplace/listings/${slug}/`, body);
  }

  deleteMarketplaceListing(slug: string) {
    return this.http.delete(`${this.base}/marketplace/listings/${slug}/`, {
      observe: 'response',
      responseType: 'text',
    });
  }

  checkoutListing(slug: string) {
    return this.http.post<MarketplaceCheckout>(`${this.base}/marketplace/listings/${slug}/checkout/`, {});
  }

  confirmMarketplaceCheckout(sessionId: string) {
    return this.http.post<MarketplacePurchase>(`${this.base}/marketplace/checkout/confirm/`, {
      session_id: sessionId,
    });
  }

  listLibrary() {
    return this.http.get<Paginated<MarketplacePurchase>>(`${this.base}/marketplace/library/`);
  }

  getMarketplaceSales() {
    return this.http.get<MarketplaceSales>(`${this.base}/marketplace/me/`);
  }

  createMarketplaceAccount() {
    return this.http.post<MarketplaceAccount>(`${this.base}/marketplace/me/account/`, {});
  }

  createMarketplaceAccountSession() {
    return this.http.post<MarketplaceAccountSession>(`${this.base}/marketplace/me/account-session/`, {});
  }
}
