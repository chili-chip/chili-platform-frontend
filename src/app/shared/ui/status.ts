import { booleanAttribute, Directive, ElementRef, inject, input } from '@angular/core';

export type UiTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/**
 * Small status label. Solid by default; `outline` gives the rounded tag look.
 * `<span uiBadge="success">Paid</span>`
 */
@Directive({
  selector: '[uiBadge]',
  host: {
    class: 'ui-badge',
    '[class]': '"ui-badge--" + (tone() || "neutral")',
    '[class.ui-badge--outline]': 'outline()',
  },
})
export class UiBadge {
  readonly tone = input<UiTone | ''>('neutral', { alias: 'uiBadge' });
  readonly outline = input(false, { transform: booleanAttribute });
}

/**
 * Filter or toggle pill. On a button, `selected` sets aria-pressed.
 * Wrap a set in `<div class="ui-chips">`.
 */
@Directive({
  selector: 'button[uiChip], a[uiChip]',
  host: {
    class: 'ui-chip',
    '[class.is-selected]': 'selected()',
    '[attr.aria-pressed]': 'isButton ? selected() : null',
  },
})
export class UiChip {
  readonly selected = input(false, { transform: booleanAttribute });
  protected readonly isButton = inject(ElementRef).nativeElement.tagName === 'BUTTON';
}

/**
 * Inline message. `<p uiNotice="error">{{ error() }}</p>`
 * `boxed` draws a border in the tone colour.
 */
@Directive({
  selector: '[uiNotice]',
  host: {
    class: 'ui-notice',
    '[class]': '"ui-notice--" + (tone() || "info")',
    '[class.ui-notice--boxed]': 'boxed()',
  },
})
export class UiNotice {
  readonly tone = input<'info' | 'success' | 'warning' | 'error' | ''>('info', {
    alias: 'uiNotice',
  });
  readonly boxed = input(false, { transform: booleanAttribute });
}
