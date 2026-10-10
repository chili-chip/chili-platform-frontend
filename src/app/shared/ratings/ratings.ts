import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SpinnerComponent } from '../loading';
import { UI } from '../ui';

/** One rating with its optional comment, as games and store products return them. */
export interface Review {
  username: string;
  stars: number;
  comment: string;
  /** Store only: the reviewer has a paid order for the product. */
  verified_purchase?: boolean;
}

export interface RatingSubmit {
  stars: number;
  comment: string;
}

export const RATING_COMMENT_MAX = 500;

/** "★★★☆☆" for 3. */
export function filledStars(count: number): string {
  const n = Math.max(0, Math.min(5, Math.round(count)));
  return '★★★★★☆☆☆☆☆'.slice(5 - n, 10 - n);
}

/** "4.5 · 2 ratings", or "— · 0 ratings" when nobody has rated yet. */
export function ratingSummary(average: number | null, count: number, short = false): string {
  const score = average === null ? '—' : average.toFixed(1);
  if (short) {
    return `${score} · ${count}`;
  }
  return `${score} · ${count} ${count === 1 ? 'rating' : 'ratings'}`;
}

/** Star picker with an optional comment. The parent saves it and hides the form once rated. */
@Component({
  selector: 'app-rating-form',
  imports: [UI, SpinnerComponent],
  template: `
    <div class="rate">
      <label uiField>
        Comment
        <textarea
          uiInput
          rows="3"
          [attr.maxlength]="maxLength"
          placeholder="Optional"
          [value]="comment()"
          [disabled]="saving()"
          (input)="comment.set($any($event.target).value)"
        ></textarea>
      </label>
      <div class="stars" role="group" [attr.aria-label]="label()">
        @for (star of starChoices; track star) {
          <button
            type="button"
            [disabled]="saving()"
            [attr.aria-label]="'Rate ' + star + ' out of 5'"
            [attr.aria-pressed]="picked() === star"
            (mouseenter)="hover.set(star)"
            (mouseleave)="hover.set(0)"
            (click)="picked.set(star)"
          >
            {{ star <= shown() ? '★' : '☆' }}
          </button>
        }
      </div>
      <button
        uiButton="ghost"
        type="button"
        [disabled]="picked() < 1 || saving()"
        (click)="submit()"
      >
        @if (saving()) {
          <app-spinner />
        }
        Rate
      </button>
    </div>
  `,
  styleUrl: './ratings.scss',
})
export class RatingFormComponent {
  readonly label = input('Rate this');
  readonly saving = input(false);
  readonly rate = output<RatingSubmit>();

  readonly starChoices = [1, 2, 3, 4, 5];
  readonly maxLength = RATING_COMMENT_MAX;
  readonly hover = signal(0);
  readonly picked = signal(0);
  readonly comment = signal('');

  shown(): number {
    return this.hover() || this.picked();
  }

  submit(): void {
    const stars = this.picked();
    if (stars < 1 || this.saving()) {
      return;
    }
    this.rate.emit({ stars, comment: this.comment() });
  }
}

/** Everyone's ratings and comments, newest first. */
@Component({
  selector: 'app-review-list',
  imports: [UI, RouterLink],
  template: `
    @if (reviews().length) {
      <ul class="reviews">
        @for (review of reviews(); track review.username) {
          <li uiCard pad="sm">
            <div class="row">
              <span class="who">
                <a [routerLink]="['/profile', review.username]">{{ review.username }}</a>
                @if (review.verified_purchase) {
                  <span uiBadge="success">Bought it</span>
                }
              </span>
              <span class="score" [attr.aria-label]="review.stars + ' out of 5'">{{
                stars(review.stars)
              }}</span>
            </div>
            @if (review.comment) {
              <p>{{ review.comment }}</p>
            }
          </li>
        }
      </ul>
    } @else if (empty()) {
      <p class="muted">{{ empty() }}</p>
    }
  `,
  styleUrl: './ratings.scss',
})
export class ReviewListComponent {
  readonly reviews = input<readonly Review[]>([]);
  /** Shown when there are no reviews. Blank shows nothing. */
  readonly empty = input('');
  readonly stars = filledStars;
}
