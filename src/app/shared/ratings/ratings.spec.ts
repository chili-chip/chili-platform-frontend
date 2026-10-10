import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  filledStars,
  RatingFormComponent,
  RatingSubmit,
  ratingSummary,
  Review,
  ReviewListComponent,
} from './ratings';

@Component({
  imports: [RatingFormComponent, ReviewListComponent],
  template: `
    <app-rating-form label="Rate this product" (rate)="sent.set($event)" />
    <app-review-list [reviews]="reviews" empty="No ratings yet." />
  `,
})
class HostComponent {
  readonly sent = signal<RatingSubmit | null>(null);
  reviews: Review[] = [];
}

describe('ratings', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('formats stars and summaries', () => {
    expect(filledStars(3)).toBe('★★★☆☆');
    expect(filledStars(5)).toBe('★★★★★');
    expect(ratingSummary(null, 0)).toBe('— · 0 ratings');
    expect(ratingSummary(4.5, 1)).toBe('4.5 · 1 rating');
    expect(ratingSummary(4, 12, true)).toBe('4.0 · 12');
  });

  it('emits the picked stars and comment', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rate = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Rate'),
    ) as HTMLButtonElement;
    expect(rate.disabled).toBeTrue();

    const textarea = el.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Solid buttons';
    textarea.dispatchEvent(new Event('input'));
    (el.querySelector('[aria-label="Rate 4 out of 5"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rate.disabled).toBeFalse();

    rate.click();
    expect(fixture.componentInstance.sent()).toEqual({ stars: 4, comment: 'Solid buttons' });
  });

  it('lists reviews and marks buyers', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No ratings yet.');

    fixture.componentInstance.reviews = [
      { username: 'habanero', stars: 5, comment: 'Love it', verified_purchase: true },
      { username: 'pepper', stars: 2, comment: '' },
    ];
    fixture.detectChanges();
    const items = el.querySelectorAll('.reviews li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Bought it');
    expect(items[0].textContent).toContain('Love it');
    expect(items[1].textContent).not.toContain('Bought it');
  });
});
