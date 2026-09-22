import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const AUTH_RETRIED = new HttpContextToken(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (isAnonymousAuthUrl(req.url)) {
    return next(req);
  }

  return next(withAuth(req, auth.accessToken())).pipe(
    catchError((err: unknown) => {
      if (
        !(err instanceof HttpErrorResponse) ||
        err.status !== 401 ||
        req.context.get(AUTH_RETRIED)
      ) {
        return throwError(() => err);
      }
      return auth.refreshAccessToken().pipe(
        switchMap((token) =>
          next(
            withAuth(req, token).clone({
              context: req.context.set(AUTH_RETRIED, true),
            }),
          ),
        ),
      );
    }),
  );
};

function withAuth(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return req;
  }
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function isAnonymousAuthUrl(url: string): boolean {
  return /\/auth\/(token|register)(\/|$|\?)/.test(url);
}
