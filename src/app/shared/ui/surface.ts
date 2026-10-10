import { booleanAttribute, ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';

import { MediaFadeDirective } from '../loading/media-fade';

/**
 * Bordered panel. Put it on any element: `<li uiCard elevated interactive>`.
 * `pad` is the inner spacing; use `none` when the card holds a cover image.
 */
@Directive({
  selector: '[uiCard]',
  host: {
    class: 'ui-card',
    '[class.ui-card--pad-none]': 'pad() === "none"',
    '[class.ui-card--pad-sm]': 'pad() === "sm"',
    '[class.ui-card--pad-lg]': 'pad() === "lg"',
    '[class.ui-card--elevated]': 'elevated()',
    '[class.ui-card--interactive]': 'interactive()',
    '[class.ui-card--muted]': 'muted()',
  },
})
export class UiCard {
  readonly pad = input<'none' | 'sm' | 'md' | 'lg'>('md');
  readonly elevated = input(false, { transform: booleanAttribute });
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly muted = input(false, { transform: booleanAttribute });
}

/** Empty or zero-results message box. `<li uiEmpty>No games yet.</li>` */
@Directive({
  selector: '[uiEmpty]',
  host: { class: 'ui-empty' },
})
export class UiEmpty {}

/** Data table. `<table uiTable>` */
@Directive({
  selector: 'table[uiTable]',
  host: { class: 'ui-table' },
})
export class UiTable {}

/** Square avatar: the picture, or the first letter of `name`. */
@Component({
  selector: 'ui-avatar',
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" />
    } @else {
      <span aria-hidden="true">{{ initial() }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-avatar', '[class.ui-avatar--lg]': 'size() === "lg"' },
})
export class UiAvatar {
  readonly src = input<string | null | undefined>('');
  readonly name = input('');
  readonly alt = input('');
  readonly size = input<'md' | 'lg'>('md');
  protected readonly initial = computed(() => (this.name() || '?').charAt(0));
}

/**
 * Cover art box: the image (faded in), or the title's first letter on the
 * chili gradient. Size it from the outside with `--cover-height` and `--cover-font`.
 */
@Component({
  selector: 'ui-cover',
  imports: [MediaFadeDirective],
  template: `
    @if (src()) {
      <img appMediaFade [src]="src()" [alt]="alt()" />
    } @else {
      <span aria-hidden="true">{{ initial() }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-cover' },
})
export class UiCover {
  readonly src = input<string | null | undefined>('');
  readonly alt = input('');
  readonly name = input('');
  protected readonly initial = computed(() => (this.name() || this.alt() || '?').charAt(0));
}

/** A figure with a label: `<ui-stat label="Available" [value]="money(cents)" />` */
@Component({
  selector: 'ui-stat',
  template: `
    <span class="ui-stat__label">{{ label() }}</span>
    <strong class="ui-stat__value">{{ value() }}</strong>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-stat' },
})
export class UiStat {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
}
