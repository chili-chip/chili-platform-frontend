import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

export type UiPageWidth = 'full' | 'prose' | 'narrow' | 'medium' | 'wide' | 'panel' | 'form';

/**
 * Page body with the standard padding. `width` caps the content:
 * prose 52rem, narrow 720px, medium 820px, wide 980px; panel (640px) and form
 * (420px) are also centered.
 */
@Directive({
  selector: '[uiPage]',
  host: {
    class: 'ui-page',
    '[class]': 'width() === "full" ? "" : "ui-page--" + width()',
  },
})
export class UiPage {
  readonly width = input<UiPageWidth | ''>('full', { alias: 'uiPage' });
}

/**
 * Kicker, title and intro with actions on the right (stacked on small screens).
 *
 * <header uiPageHeader kicker="Chilichip" heading="Store">
 *   <p class="lede">Kits, shells and parts.</p>
 *   <a uiButton="ghost" uiPageActions routerLink="/login">Sign in</a>
 * </header>
 *
 * `level="2"` renders an h2 for sections inside a page.
 */
@Component({
  selector: '[uiPageHeader]',
  template: `
    <div class="ui-page-header__copy">
      @if (kicker()) {
        <p class="kicker">{{ kicker() }}</p>
      }
      @if (level() === 2) {
        <h2>{{ heading() }}</h2>
      } @else {
        <h1>{{ heading() }}</h1>
      }
      <ng-content />
    </div>
    <div class="ui-page-header__actions"><ng-content select="[uiPageActions]" /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-page-header', '[class.ui-page-header--section]': 'level() === 2' },
})
export class UiPageHeader {
  readonly heading = input.required<string>();
  readonly kicker = input('');
  readonly level = input<1 | 2>(1);
}

/** Marks the actions projected into the right side of a uiPageHeader. */
@Directive({ selector: '[uiPageActions]' })
export class UiPageActions {}

/** "← Back" link above a page title. `<a uiBackLink routerLink="/store">← Store</a>` */
@Directive({
  selector: 'a[uiBackLink]',
  host: { class: 'ui-back-link' },
})
export class UiBackLink {}
