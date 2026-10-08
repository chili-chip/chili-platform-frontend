import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

/** Navigations shorter than this never show the bar, so quick hops don't flicker. */
const SHOW_AFTER_MS = 150;

/**
 * Thin progress bar pinned to the top of the viewport while a route is
 * navigating: lazy chunk download, guards and resolvers. Page-level data
 * loading is handled by skeletons inside each page.
 */
@Component({
  selector: 'app-route-progress',
  template: `
    @if (active()) {
      <div class="bar" role="progressbar" aria-label="Loading page" aria-busy="true"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: fixed;
      inset: 0 0 auto 0;
      height: 3px;
      z-index: 100;
      pointer-events: none;
      overflow: hidden;
    }

    .bar {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, var(--chili), var(--chili-hot));
      box-shadow: 0 0 10px var(--chili);
      animation: route-progress-slide 1.1s ease-in-out infinite;
    }

    @keyframes route-progress-slide {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(250%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bar {
        width: 100%;
        animation: route-progress-pulse 1.6s ease-in-out infinite;
      }
    }

    @keyframes route-progress-pulse {
      0%,
      100% {
        opacity: 0.35;
      }
      50% {
        opacity: 1;
      }
    }
  `,
})
export class RouteProgressComponent {
  protected readonly active = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const subscription = inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.clearTimer();
        this.timer = setTimeout(() => this.active.set(true), SHOW_AFTER_MS);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof NavigationSkipped
      ) {
        this.clearTimer();
        this.active.set(false);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.clearTimer();
    });
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
