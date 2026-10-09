import { CanDeactivateFn } from '@angular/router';

/** A page that can hold unsaved work, such as the creator. */
export interface LeaveCheck {
  /** Returns false to stay on the page when moving to `nextUrl`. */
  canLeave(nextUrl: string): boolean;
}

export const unsavedWorkGuard: CanDeactivateFn<LeaveCheck> = (component, _route, _state, next) =>
  component?.canLeave ? component.canLeave(next.url) : true;
