import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

/**
 * Fixed stack of toasts, mounted once in the app shell. Successes are announced
 * politely, errors assertively (`role="alert"`).
 */
@Component({
  selector: 'app-toast-host',
  template: `
    <div class="stack" role="region" aria-label="Notifications">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="toast"
          [class]="'toast toast--' + toast.kind"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
          (mouseenter)="toasts.pause(toast.id)"
          (mouseleave)="toasts.resume(toast.id)"
          (focusin)="toasts.pause(toast.id)"
          (focusout)="toasts.resume(toast.id)"
        >
          <span class="message">{{ toast.message }}</span>
          <button
            type="button"
            class="close"
            aria-label="Dismiss"
            (click)="toasts.dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 110;
      pointer-events: none;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      max-width: min(26rem, calc(100vw - 2rem));
      padding: 0.7rem 0.9rem;
      background: var(--bg-1);
      border: 1px solid var(--line);
      border-left-width: 3px;
      box-shadow: 4px 4px 0 rgb(0 0 0 / 0.45);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      line-height: 1.4;
      color: var(--text);
      animation: toast-in 0.18s ease-out;
    }

    .toast--success {
      border-left-color: var(--phosphor);
    }

    .toast--error {
      border-left-color: var(--chili);
    }

    .toast--info {
      border-left-color: var(--amber);
    }

    .message {
      flex: 1;
      overflow-wrap: anywhere;
    }

    .close {
      flex: none;
      padding: 0 0.15rem;
      background: none;
      border: 0;
      color: var(--muted);
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
    }

    .close:hover,
    .close:focus-visible {
      color: var(--text);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
      }
    }

    @media (max-width: 600px) {
      :host {
        right: 0.5rem;
        left: 0.5rem;
        bottom: 0.5rem;
      }

      .stack {
        align-items: stretch;
      }

      .toast {
        max-width: none;
      }
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
}
