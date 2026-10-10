import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UI } from './index';

@Component({
  imports: [UI],
  template: `
    <button uiButton="ghost" size="sm" class="extra" type="button">Go</button>
    <a uiButton href="/x">Link</a>
    <button uiChip type="button" [selected]="selected()">Chip</button>
    <label uiField [error]="error()">Email <input uiInput /></label>
    <span uiBadge="success">Paid</span>
    <ui-quantity [value]="2" [max]="2" (valueChange)="changed = $event" (remove)="removed = true" />
  `,
})
class HostComponent {
  readonly selected = signal(false);
  readonly error = signal('');
  changed: number | null = null;
  removed = false;
}

describe('UI library', () => {
  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('applies button variant and size classes alongside existing ones', () => {
    const { el } = render();
    const button = el.querySelector('button.extra')!;
    expect(button.className).toContain('ui-btn');
    expect(button.className).toContain('ui-btn--ghost');
    expect(button.className).toContain('ui-btn--sm');
    expect(button.className).toContain('extra');
    expect(el.querySelector('a')!.className).toContain('ui-btn--primary');
  });

  it('reflects chip selection in aria-pressed', () => {
    const { fixture, el } = render();
    const chip = el.querySelector('.ui-chip')!;
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fixture.componentInstance.selected.set(true);
    fixture.detectChanges();
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.classList).toContain('is-selected');
  });

  it('shows a field error as an alert', () => {
    const { fixture, el } = render();
    expect(el.querySelector('.ui-field__error')).toBeNull();
    fixture.componentInstance.error.set('Enter a valid email address.');
    fixture.detectChanges();
    const error = el.querySelector('.ui-field__error')!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Enter a valid email address.');
    expect(el.querySelector('input')!.classList).toContain('ui-input');
  });

  it('sets the badge tone', () => {
    const { el } = render();
    expect(el.querySelector('.ui-badge')!.classList).toContain('ui-badge--success');
  });

  it('steps the quantity within its bounds', () => {
    const { fixture, el } = render();
    const [fewer, more, remove] = Array.from(el.querySelectorAll<HTMLButtonElement>('ui-quantity button'));
    expect(more.disabled).toBeTrue();
    fewer.click();
    expect(fixture.componentInstance.changed).toBe(1);
    remove.click();
    expect(fixture.componentInstance.removed).toBeTrue();
  });
});
