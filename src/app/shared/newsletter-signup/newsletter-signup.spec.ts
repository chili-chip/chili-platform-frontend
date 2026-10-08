import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { NewsletterSignupComponent } from './newsletter-signup';

describe('NewsletterSignupComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterSignupComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does not call the API for an invalid email', () => {
    const component = TestBed.createComponent(NewsletterSignupComponent).componentInstance;
    component.form.setValue({ email: 'nope' });
    component.submit();
    expect(component.error()).toBe('Enter a valid email address.');
  });

  it('shows the confirmation message after subscribing', () => {
    const component = TestBed.createComponent(NewsletterSignupComponent).componentInstance;
    component.form.setValue({ email: 'fan@example.com' });
    component.submit();
    const request = http.expectOne(`${environment.apiUrl}/newsletter/subscribe/`);
    expect(request.request.body).toEqual({ email: 'fan@example.com' });
    request.flush({ detail: 'Check your inbox.' }, { status: 202, statusText: 'Accepted' });
    expect(component.message()).toBe('Check your inbox.');
    expect(component.form.getRawValue().email).toBe('');
  });
});
