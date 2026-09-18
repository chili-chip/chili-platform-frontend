import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, AuthTokens, UserProfile } from '../models/platform';

const ACCESS_KEY = 'chili.accessToken';
const REFRESH_KEY = 'chili.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  readonly currentUser = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  constructor() {
    if (this.accessToken()) {
      this.refreshProfile().subscribe({
        error: () => this.logout(false),
      });
    }
  }

  register(payload: {
    username: string;
    email: string;
    password: string;
    bio?: string;
  }) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register/`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  login(username: string, password: string) {
    return this.http
      .post<AuthTokens>(`${environment.apiUrl}/auth/token/`, { username, password })
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        tap(() => this.refreshProfile().subscribe()),
      );
  }

  refreshProfile() {
    return this.http
      .get<UserProfile>(`${environment.apiUrl}/profiles/me/`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  updateProfile(payload: Pick<UserProfile, 'bio' | 'avatar_url'>) {
    return this.http
      .put<UserProfile>(`${environment.apiUrl}/profiles/me/`, payload)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(navigate = true): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    if (navigate) {
      void this.router.navigate(['/']);
    }
  }

  private persistSession(response: AuthResponse): void {
    this.storeTokens(response);
    this.currentUser.set(response.user);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
    this.accessToken.set(tokens.access);
  }
}
