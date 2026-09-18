import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  ForumCategory,
  ForumComment,
  ForumPost,
  Paginated,
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
}
