import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UI, UiPageWidth, UiTone } from './index';

@Component({
  imports: [UI],
  template: `
    <main [uiPage]="width()">
      <header uiPageHeader kicker="Chilichip" heading="Store" [level]="level()">
        <p class="lede">Kits</p>
        <a uiButton="ghost" uiPageActions href="/login">Sign in</a>
      </header>
    </main>
    <a uiChip href="/x" selected>Link chip</a>
    <span [uiBadge]="tone()" outline>Tag</span>
    <p uiNotice="error" boxed>Failed</p>
    <p uiNotice>Info</p>
    <li uiCard pad="none" elevated interactive>Card</li>
    <label uiField hint="Shown on your profile" [error]="error()">
      Name <input uiInput size="sm" />
    </label>
    <label uiChoice><input type="checkbox" uiCheck /> Agree</label>
    <ui-avatar name="kacper" />
    <ui-avatar src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Avatar" size="lg" />
    <ui-cover name="Bitsy game" />
    <ui-stat label="Available" [value]="12" />
    <button uiButton="danger" size="icon" block type="button">x</button>
  `,
})
class HostComponent {
  readonly width = signal<UiPageWidth | ''>('narrow');
  readonly level = signal<1 | 2>(1);
  readonly tone = signal<UiTone>('warning');
  readonly error = signal('');
}

describe('UI library components', () => {
  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('sets the page width class and drops it for full width', () => {
    const { fixture, el } = render();
    const page = el.querySelector('main')!;
    expect(page.className).toBe('ui-page ui-page--narrow');
    fixture.componentInstance.width.set('full');
    fixture.detectChanges();
    expect(page.className).toBe('ui-page');
  });

  it('renders the page header as h1, or h2 at level 2, with actions on the side', () => {
    const { fixture, el } = render();
    const header = el.querySelector('.ui-page-header')!;
    expect(header.querySelector('.kicker')!.textContent).toBe('Chilichip');
    expect(header.querySelector('h1')!.textContent).toBe('Store');
    expect(header.querySelector('.ui-page-header__copy .lede')).not.toBeNull();
    expect(header.querySelector('.ui-page-header__actions a.ui-btn--ghost')).not.toBeNull();
    fixture.componentInstance.level.set(2);
    fixture.detectChanges();
    expect(header.querySelector('h1')).toBeNull();
    expect(header.querySelector('h2')!.textContent).toBe('Store');
    expect(header.classList).toContain('ui-page-header--section');
  });

  it('leaves aria-pressed off link chips', () => {
    const { el } = render();
    const chip = el.querySelector('a.ui-chip')!;
    expect(chip.classList).toContain('is-selected');
    expect(chip.hasAttribute('aria-pressed')).toBeFalse();
  });

  it('switches badge tones and keeps the outline', () => {
    const { fixture, el } = render();
    const badge = el.querySelector('.ui-badge')!;
    expect(badge.className).toContain('ui-badge--warning');
    expect(badge.classList).toContain('ui-badge--outline');
    fixture.componentInstance.tone.set('danger');
    fixture.detectChanges();
    expect(badge.className).toContain('ui-badge--danger');
    expect(badge.className).not.toContain('ui-badge--warning');
  });

  it('defaults notices to info and supports boxed', () => {
    const { el } = render();
    const [error, info] = Array.from(el.querySelectorAll('.ui-notice'));
    expect(error.classList).toContain('ui-notice--error');
    expect(error.classList).toContain('ui-notice--boxed');
    expect(info.classList).toContain('ui-notice--info');
  });

  it('maps card options to modifier classes', () => {
    const { el } = render();
    const card = el.querySelector('.ui-card')!;
    for (const name of ['ui-card--pad-none', 'ui-card--elevated', 'ui-card--interactive']) {
      expect(card.classList).toContain(name);
    }
    expect(card.classList).not.toContain('ui-card--muted');
  });

  it('shows the field hint until there is an error', () => {
    const { fixture, el } = render();
    const field = el.querySelector('.ui-field')!;
    expect(field.querySelector('.ui-field__hint')!.textContent).toBe('Shown on your profile');
    fixture.componentInstance.error.set('Required');
    fixture.detectChanges();
    expect(field.querySelector('.ui-field__hint')).toBeNull();
    expect(field.querySelector('.ui-field__error')!.textContent).toBe('Required');
    expect(field.querySelector('input')!.classList).toContain('ui-input--sm');
  });

  it('styles checkboxes and their label', () => {
    const { el } = render();
    expect(el.querySelector('label.ui-choice input.ui-check')).not.toBeNull();
  });

  it('shows an avatar picture, or the initial when there is none', () => {
    const { el } = render();
    const [initial, picture] = Array.from(el.querySelectorAll('ui-avatar'));
    expect(initial.textContent!.trim()).toBe('k');
    expect(initial.querySelector('img')).toBeNull();
    expect(picture.querySelector('img')!.getAttribute('alt')).toBe('Avatar');
    expect(picture.classList).toContain('ui-avatar--lg');
  });

  it('falls back to the title initial on a cover without art', () => {
    const { el } = render();
    const cover = el.querySelector('ui-cover')!;
    expect(cover.querySelector('img')).toBeNull();
    expect(cover.textContent!.trim()).toBe('B');
  });

  it('renders a stat label and value', () => {
    const { el } = render();
    expect(el.querySelector('.ui-stat__label')!.textContent).toBe('Available');
    expect(el.querySelector('.ui-stat__value')!.textContent).toBe('12');
  });

  it('combines button variant, size and block', () => {
    const { el } = render();
    const button = el.querySelector('button.ui-btn')!;
    for (const name of ['ui-btn--danger', 'ui-btn--icon', 'ui-btn--block']) {
      expect(button.classList).toContain(name);
    }
  });
});
