import { booleanAttribute, Directive, input } from '@angular/core';

export type UiButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'text';
export type UiButtonSize = 'md' | 'sm' | 'icon';

/**
 * Site button. Works on `<button>`, `<a>` and `<label>` (for file pickers).
 *
 * <button uiButton>Save</button>
 * <a uiButton="ghost" routerLink="/store">Store</a>
 * <button uiButton="danger" size="sm">Remove</button>
 */
@Directive({
  selector: 'button[uiButton], a[uiButton], label[uiButton]',
  host: {
    class: 'ui-btn',
    '[class]': '"ui-btn--" + (variant() || "primary") + " ui-btn--" + size()',
    '[class.ui-btn--block]': 'block()',
  },
})
export class UiButton {
  readonly variant = input<UiButtonVariant | ''>('primary', { alias: 'uiButton' });
  readonly size = input<UiButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
}
