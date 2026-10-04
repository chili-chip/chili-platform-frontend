import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, AuthTokens, UserProfile } from '../models/platform';

const ACCESS_KEY = 'chili.accessToken';
const REFRESH_KEY = 'chili.refreshToken';
const USER_KEY = 'chili.currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private refreshInFlight: Observable<string> | null = null;

  readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  readonly currentUser = signal<UserProfile | null>(readStoredUser());
  readonly bootstrapped = signal(false);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  constructor() {
    this.restoreSession();
  }

  register(payload: {
    username: string;
    email: string;
    password: string;
    bio?: string;
    accept_terms: boolean;
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
      .pipe(tap((user) => this.persistUser(user)));
  }

  acceptLegal(body: { terms?: boolean; seller_terms?: boolean }) {
    return this.http
      .post<UserProfile>(`${environment.apiUrl}/profiles/me/acceptance/`, body)
      .pipe(tap((user) => this.persistUser(user)));
  }

  updateProfile(payload: Pick<UserProfile, 'bio' | 'avatar_url'>) {
    return this.http
      .put<UserProfile>(`${environment.apiUrl}/profiles/me/`, payload)
      .pipe(tap((user) => this.persistUser(user)));
  }

  refreshAccessToken(): Observable<string> {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      this.logout(false);
      return throwError(() => new Error('No refresh token'));
    }
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<{ access: string; refresh?: string }>(`${environment.apiUrl}/auth/token/refresh/`, {
          refresh,
        })
        .pipe(
          tap((tokens) =>
            this.storeTokens({
              access: tokens.access,
              refresh: tokens.refresh || refresh,
            }),
          ),
          map((tokens) => tokens.access),
          catchError((err) => {
            this.logout(false);
            return throwError(() => err);
          }),
          finalize(() => {
            this.refreshInFlight = null;
          }),
          shareReplay(1),
        );
    }
    return this.refreshInFlight;
  }

  verifyEmail(uid: string, token: string) {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/auth/verify-email/`, {
      uid,
      token,
    });
  }

  resendVerification() {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/auth/verify-email/resend/`, {});
  }

  requestPasswordReset(email: string) {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/auth/password/reset/`, { email });
  }

  confirmPasswordReset(payload: { uid: string; token: string; password: string }) {
    return this.http.post<{ detail: string }>(
      `${environment.apiUrl}/auth/password/reset/confirm/`,
      payload,
    );
  }

  logout(navigate = true): void {
    const refresh = localStorage.getItem(REFRESH_KEY);
    this.clearSession();
    if (refresh) {
      this.http.post(`${environment.apiUrl}/auth/logout/`, { refresh }).subscribe({
        error: () => undefined,
      });
    }
    if (navigate) {
      void this.router.navigate(['/']);
    }
  }

  safeReturnUrl(value: string | null | undefined): string | null {
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return null;
    }
    return value;
  }

  private restoreSession(): void {
    const access = this.accessToken();
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!access && !refresh) {
      this.bootstrapped.set(true);
      return;
    }

    const session$ = access
      ? this.refreshProfile()
      : this.refreshAccessToken().pipe(switchMap(() => this.refreshProfile()));

    session$.subscribe({
      next: () => this.bootstrapped.set(true),
      error: () => this.bootstrapped.set(true),
    });
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  private persistSession(response: AuthResponse): void {
    this.storeTokens(response);
    this.persistUser(response.user);
  }

  private persistUser(user: UserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_KEY, tokens.refresh);
    }
    this.accessToken.set(tokens.access);
  }
}

function readStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}
