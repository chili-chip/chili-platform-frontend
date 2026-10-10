import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UiDialog, UiDialogFooter, UiDialogService } from './dialog';

@Component({
  imports: [UiDialog, UiDialogFooter],
  template: `
    <button type="button" id="opener">Open</button>
    <ng-template #content>
      <ui-dialog heading="Filters" [closable]="closable">
        <input id="first" />
        <footer uiDialogFooter><button type="button">Apply</button></footer>
      </ui-dialog>
    </ng-template>
  `,
})
class HostComponent {
  readonly dialog = inject(UiDialogService);
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
  closable = true;

  open(): DialogRef<unknown, unknown> {
    return this.dialog.open(this.content());
  }
}

describe('UiDialog', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove()));

  function openDialog(closable = true) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.closable = closable;
    fixture.autoDetectChanges();
    const ref = fixture.componentInstance.open();
    fixture.detectChanges();
    const panel = document.querySelector<HTMLElement>('.ui-dialog-panel')!;
    return { fixture, ref, panel };
  }

  it('opens with the site defaults and a labelled dialog role', async () => {
    const { fixture, panel } = openDialog();
    await fixture.whenStable();
    expect(panel).not.toBeNull();
    expect(document.querySelector('.ui-dialog-backdrop')).not.toBeNull();
    const container = panel.querySelector('[role="dialog"]')!;
    const heading = panel.querySelector('h2')!;
    expect(heading.textContent).toBe('Filters');
    expect(container.getAttribute('aria-labelledby')).toContain(heading.id);
    expect(panel.querySelector('.ui-dialog__footer')).not.toBeNull();
  });

  it('closes from the close button', () => {
    const { ref, panel } = openDialog();
    let closed = false;
    ref.closed.subscribe(() => (closed = true));
    panel.querySelector<HTMLButtonElement>('.ui-dialog__close')!.click();
    expect(closed).toBeTrue();
  });

  it('closes on Escape', () => {
    const { ref } = openDialog();
    let closed = false;
    ref.closed.subscribe(() => (closed = true));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    expect(closed).toBeTrue();
  });

  it('hides the close button when not closable', () => {
    const { panel } = openDialog(false);
    expect(panel.querySelector('.ui-dialog__close')).toBeNull();
  });
});
