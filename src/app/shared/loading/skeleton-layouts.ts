import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SkeletonComponent } from './skeleton';

/** Fixed list of N items so templates can `@for` over placeholders. */
function placeholders(count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => index);
}

/**
 * Grid of card placeholders. The grid and card geometry mirror the real
 * `.catalog` (store products) and `.game-grid` (game tiles) so content swaps
 * in without a layout jump.
 */
@Component({
  selector: 'app-skeleton-grid',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-busy': 'true' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    <ul [class]="variant()">
      @for (item of items(); track item) {
        <li class="card" aria-hidden="true">
          <app-skeleton [height]="variant() === 'product' ? '160px' : '140px'" />
          <div class="body">
            @if (variant() === 'product') {
              <div class="meta">
                <app-skeleton width="30%" height="0.7rem" />
                <app-skeleton width="24%" height="0.7rem" />
              </div>
              <app-skeleton width="70%" height="1.25rem" />
              <app-skeleton width="95%" height="0.9rem" />
              <div class="buy">
                <app-skeleton width="4.5rem" height="1.15rem" />
                <app-skeleton width="7.5rem" height="2.4rem" />
              </div>
            } @else {
              <div class="meta">
                <app-skeleton width="35%" height="0.75rem" />
              </div>
              <app-skeleton width="75%" height="1.05rem" />
              <app-skeleton width="50%" height="0.75rem" />
              <app-skeleton width="30%" height="1.05rem" />
            }
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    ul {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 1rem;
    }

    ul.product {
      margin: 1.8rem 0 0;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    ul.game {
      margin: 1.4rem 0 0;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }

    .card {
      display: grid;
      overflow: hidden;
      min-width: 0;
      background: var(--bg-1);
      border: 1px solid var(--line);
      box-shadow: var(--shadow-card);
    }

    .body {
      display: grid;
      gap: 0.55rem;
      padding: 1rem;
    }

    .game .body {
      gap: 0.45rem;
      padding: 0.9rem 1rem 1rem;
    }

    .meta,
    .buy {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.8rem;
    }
  `,
})
export class SkeletonGridComponent {
  readonly variant = input<'product' | 'game'>('game');
  readonly count = input(8);
  readonly label = input('Loading');

  protected readonly items = computed(() => placeholders(this.count()));
}

/** Rows that match the community thread feed (avatar, meta line, title, byline). */
@Component({
  selector: 'app-skeleton-threads',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-busy': 'true' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    <ul aria-hidden="true">
      @for (item of items(); track item) {
        <li>
          <app-skeleton width="42px" height="42px" />
          <div class="text">
            <app-skeleton width="40%" height="0.8rem" />
            <app-skeleton width="65%" height="1.1rem" />
            <app-skeleton width="30%" height="0.85rem" />
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.7rem;
    }

    li {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.9rem;
      padding: 1rem;
      background: var(--bg-1);
      border: 1px solid var(--line);
    }

    .text {
      display: grid;
      gap: 0.55rem;
      min-width: 0;
    }
  `,
})
export class SkeletonThreadsComponent {
  readonly count = input(5);
  readonly label = input('Loading threads');

  protected readonly items = computed(() => placeholders(this.count()));
}

/**
 * Generic stack of text rows: reviews, comments, order lines, table-like
 * lists. `boxed` draws each row as a bordered card like the real lists.
 */
@Component({
  selector: 'app-skeleton-rows',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-busy': 'true' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    <ul aria-hidden="true">
      @for (item of items(); track item) {
        <li [class.boxed]="boxed()">
          <app-skeleton width="35%" height="0.8rem" />
          <app-skeleton width="90%" height="0.95rem" />
          <app-skeleton width="60%" height="0.95rem" />
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.7rem;
    }

    li {
      display: grid;
      gap: 0.5rem;
    }

    li.boxed {
      padding: 0.9rem 1rem;
      background: var(--bg-1);
      border: 1px solid var(--line);
    }
  `,
})
export class SkeletonRowsComponent {
  readonly count = input(3);
  readonly boxed = input(true);
  readonly label = input('Loading');

  protected readonly items = computed(() => placeholders(this.count()));
}

/**
 * Detail page header: a cover next to a title block, then an optional body.
 * Used by product, game and similar pages (cover left, copy right).
 */
@Component({
  selector: 'app-skeleton-detail',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-busy': 'true',
    '[style.--detail-columns]': 'columns() || null',
    '[style.--detail-gap]': 'gap() || null',
  },
  template: `
    <span class="sr-only">{{ label() }}</span>
    <div class="hero" aria-hidden="true">
      <app-skeleton [height]="coverHeight()" />
      <div class="copy">
        <app-skeleton width="25%" height="0.7rem" />
        <app-skeleton width="75%" height="2.2rem" />
        <app-skeleton width="90%" height="0.95rem" />
        <app-skeleton width="55%" height="0.95rem" />
        <app-skeleton width="30%" height="0.8rem" />
        <div class="buy">
          <app-skeleton width="5rem" height="1.4rem" />
          <app-skeleton width="8rem" height="2.4rem" />
        </div>
      </div>
    </div>
    @if (body()) {
      <div class="article" aria-hidden="true">
        <app-skeleton width="100%" height="0.95rem" />
        <app-skeleton width="96%" height="0.95rem" />
        <app-skeleton width="88%" height="0.95rem" />
        <app-skeleton width="60%" height="0.95rem" />
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .hero {
      display: grid;
      grid-template-columns: var(--detail-columns, minmax(220px, 340px) minmax(0, 1fr));
      gap: var(--detail-gap, 1.6rem);
      align-items: start;
    }

    .copy {
      display: grid;
      gap: 0.8rem;
    }

    .buy {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-top: 0.4rem;
    }

    .article {
      display: grid;
      gap: 0.7rem;
      margin-top: 2rem;
    }

    @media (max-width: 640px) {
      .hero {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class SkeletonDetailComponent {
  readonly coverHeight = input('260px');
  /** CSS `grid-template-columns` for cover + copy; defaults to the store product layout. */
  readonly columns = input('');
  readonly gap = input('');
  readonly body = input(true);
  readonly label = input('Loading');
}

/** A post / article header with a text body (community thread, order, receipt). */
@Component({
  selector: 'app-skeleton-article',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-busy': 'true' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    <div class="article" aria-hidden="true">
      <app-skeleton width="5rem" height="1.2rem" />
      <app-skeleton width="70%" height="2.4rem" />
      <app-skeleton width="35%" height="0.8rem" />
      <div class="lines">
        <app-skeleton width="100%" height="0.95rem" />
        <app-skeleton width="97%" height="0.95rem" />
        <app-skeleton width="92%" height="0.95rem" />
        <app-skeleton width="55%" height="0.95rem" />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .article {
      display: grid;
      gap: 0.8rem;
    }

    .lines {
      display: grid;
      gap: 0.6rem;
      margin-top: 0.6rem;
    }
  `,
})
export class SkeletonArticleComponent {
  readonly label = input('Loading');
}
