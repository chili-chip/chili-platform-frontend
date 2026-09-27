import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  ForumCategory,
  ForumComment,
  ForumPost,
  GameProject,
  Paginated,
  StoreCheckoutSession,
  StoreOrder,
  StoreProduct,
  UserProfile,
} from '../models/platform';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

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

  listGames(username: string) {
    const params = new HttpParams().set('username', username);
    return this.http.get<Paginated<GameProject> | GameProject[]>(`${this.base}/games/`, { params });
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

  listProducts() {
    return this.http.get<Paginated<StoreProduct> | StoreProduct[]>(`${this.base}/store/products/`);
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
}
