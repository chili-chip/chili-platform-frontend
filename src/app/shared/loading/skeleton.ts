import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A single shimmering placeholder shape. Size it with `width` / `height`
 * (any CSS length) so it takes the same space as the content it replaces.
 */
@Component({
  selector: 'app-skeleton',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.aspect-ratio]': 'ratio() || null',
    '[class.is-circle]': 'shape() === "circle"',
  },
  styles: `
    :host {
      display: block;
      max-width: 100%;
      background: linear-gradient(
        90deg,
        var(--line) 0%,
        color-mix(in srgb, var(--line) 55%, var(--muted)) 50%,
        var(--line) 100%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.4s linear infinite;
    }

    :host(.is-circle) {
      border-radius: 50%;
    }

    @keyframes skeleton-shimmer {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
        background: var(--line);
      }
    }
  `,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
  /** CSS `aspect-ratio` (e.g. `1` or `16 / 9`); pair with `height="auto"`. */
  readonly ratio = input('');
  readonly shape = input<'block' | 'circle'>('block');
}
