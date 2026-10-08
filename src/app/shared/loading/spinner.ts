import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Compact spinner for short waits: buttons, inline actions, small panels.
 * Use skeletons for primary page content instead.
 *
 * - Inline by default, sized in `em` so it follows the surrounding font size.
 * - `block` centers it in its own padded row (for panels with no skeleton).
 * - Pass a `label` to announce it to screen readers; without one it is
 *   decorative (the button or text next to it already says what is happening).
 */
@Component({
  selector: 'app-spinner',
  template: `
    <span class="ring" aria-hidden="true"></span>
    @if (label()) {
      <span class="sr-only">{{ label() }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'label() ? "status" : null',
    '[class.is-block]': 'block()',
    '[style.--spinner-size]': 'size()',
  },
  styles: `
    :host {
      display: inline-flex;
      vertical-align: -0.15em;
      --spinner-size: 1em;
    }

    :host(.is-block) {
      display: flex;
      justify-content: center;
      padding: 2rem 0;
      --spinner-size: 1.75rem;
    }

    .ring {
      width: var(--spinner-size);
      height: var(--spinner-size);
      border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spinner-turn 0.8s linear infinite;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    @keyframes spinner-turn {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ring {
        animation: spinner-pulse 1.6s ease-in-out infinite;
        border-color: currentColor;
      }
    }

    @keyframes spinner-pulse {
      0%,
      100% {
        opacity: 0.25;
      }
      50% {
        opacity: 0.9;
      }
    }
  `,
})
export class SpinnerComponent {
  readonly label = input('');
  readonly block = input(false);
  readonly size = input('');
}
