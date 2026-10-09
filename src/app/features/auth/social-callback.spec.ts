import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { SocialCallbackComponent } from './social-callback';

const PENDING = 'chili.socialLogin';

function setup(query: Record<string, string>) {
  TestBed.configureTestingModule({
    imports: [SocialCallbackComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ provider: 'github' }),
            queryParamMap: convertToParamMap(query),
          },
        },
      },
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  spyOn(router, 'navigateByUrl').and.resolveTo(true);
  const fixture = TestBed.createComponent(SocialCallbackComponent);
  fixture.detectChanges();
  return { http, router, component: fixture.componentInstance };
}

describe('SocialCallbackComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => sessionStorage.removeItem(PENDING));

  it('refuses a state this browser did not start', () => {
    sessionStorage.setItem(
      PENDING,
      JSON.stringify({ provider: 'github', state: 'mine', next: null, link: false }),
    );
    const { http, component } = setup({ code: 'c', state: 'someone-elses' });
    http.expectNone(`${environment.apiUrl}/auth/social/github/callback/`);
    expect(component.error()).toContain('invalid');
    expect(sessionStorage.getItem(PENDING)).toBeNull();
  });

  it('signs in and goes to the saved page', () => {
    sessionStorage.setItem(
      PENDING,
      JSON.stringify({ provider: 'github', state: 's1', next: '/creator', link: false }),
    );
    const { http, router } = setup({ code: 'c', state: 's1' });
    const request = http.expectOne(`${environment.apiUrl}/auth/social/github/callback/`);
    expect(request.request.body).toEqual({ code: 'c', state: 's1' });
    request.flush({
      access: 'a',
      refresh: 'r',
      created: true,
      user: { id: 1, username: 'pepper', avatar_url: '', bio: '', created_at: null },
    });
    expect(localStorage.getItem('chili.accessToken')).toBe('a');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/creator');
  });

  it('shows the API reason when sign-in is refused', () => {
    sessionStorage.setItem(
      PENDING,
      JSON.stringify({ provider: 'github', state: 's1', next: null, link: false }),
    );
    const { http, component } = setup({ code: 'c', state: 's1' });
    http
      .expectOne(`${environment.apiUrl}/auth/social/github/callback/`)
      .flush(
        { detail: 'An account with this email already exists.', code: 'email_in_use' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(component.error()).toBe('An account with this email already exists.');
  });

  it('reports a cancelled sign-in', () => {
    const { component } = setup({ error: 'access_denied' });
    expect(component.error()).toBe('GitHub sign-in was cancelled.');
  });
});
