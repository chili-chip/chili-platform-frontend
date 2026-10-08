import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const MAX_VISIBLE = 4;
const DURATION_MS: Record<ToastKind, number> = { success: 4000, info: 4000, error: 8000 };

/**
 * App-wide feedback for completed or failed actions. Rendered by
 * `ToastHostComponent`. Errors stay longer than successes so they can be read.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }

  /** Stop the auto-dismiss countdown, e.g. while the pointer or focus is on the toast. */
  pause(id: number): void {
    this.clearTimer(id);
  }

  resume(id: number): void {
    const toast = this.toasts().find((item) => item.id === id);
    if (toast && !this.timers.has(id)) {
      this.schedule(toast);
    }
  }

  private show(kind: ToastKind, message: string): void {
    const text = message.trim();
    if (!text) {
      return;
    }
    const duplicate = this.toasts().find((toast) => toast.kind === kind && toast.message === text);
    if (duplicate) {
      this.clearTimer(duplicate.id);
      this.schedule(duplicate);
      return;
    }
    const toast: Toast = { id: this.nextId++, kind, message: text };
    const overflow = this.toasts().length + 1 - MAX_VISIBLE;
    if (overflow > 0) {
      this.toasts()
        .slice(0, overflow)
        .forEach((old) => this.clearTimer(old.id));
    }
    this.toasts.update((current) => [...current, toast].slice(-MAX_VISIBLE));
    this.schedule(toast);
  }

  private schedule(toast: Toast): void {
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), DURATION_MS[toast.kind]),
    );
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
