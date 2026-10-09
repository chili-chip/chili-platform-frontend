import { ComponentType } from '@angular/cdk/portal';
import { CdkDialogContainer, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  Injectable,
  OnInit,
  TemplateRef,
} from '@angular/core';

let nextId = 0;

/** The site's dialog look and focus handling. */
export const UI_DIALOG_CONFIG: DialogConfig = {
  panelClass: 'ui-dialog-panel',
  backdropClass: 'ui-dialog-backdrop',
  hasBackdrop: true,
  autoFocus: 'first-tabbable',
  restoreFocus: true,
  width: '420px',
};

/**
 * Opens a component or template as a modal dialog (CDK Dialog with the site's
 * defaults: backdrop, focus trap, Escape to close, focus restored after).
 * Wrap the content in `<ui-dialog>`.
 */
@Injectable({ providedIn: 'root' })
export class UiDialogService {
  private readonly dialog = inject(Dialog);

  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config: DialogConfig<D, DialogRef<R, C>> = {},
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(content, { ...(UI_DIALOG_CONFIG as DialogConfig<D, DialogRef<R, C>>), ...config });
  }
}

/**
 * Frame for dialog content opened with the CDK `Dialog` service: heading,
 * close button, body and an optional `[uiDialogFooter]`. The heading labels
 * the dialog for screen readers.
 *
 * <ui-dialog heading="Filters">
 *   ...body...
 *   <footer uiDialogFooter>...</footer>
 * </ui-dialog>
 */
@Component({
  selector: 'ui-dialog',
  template: `
    <header class="ui-dialog__header">
      <div>
        <ng-content select="[uiDialogKicker]" />
        <h2 [id]="headingId">{{ heading() }}</h2>
      </div>
      @if (closable()) {
        <button type="button" class="ui-dialog__close" aria-label="Close" (click)="close()">×</button>
      }
    </header>
    <ng-content />
    <ng-content select="[uiDialogFooter]" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-dialog' },
})
export class UiDialog implements OnInit, OnDestroy {
  readonly heading = input.required<string>();
  readonly closable = input(true, { transform: booleanAttribute });

  protected readonly headingId = `ui-dialog-heading-${nextId++}`;
  private readonly ref = inject(DialogRef, { optional: true });

  ngOnInit(): void {
    this.container()?._addAriaLabelledBy(this.headingId);
  }

  ngOnDestroy(): void {
    this.container()?._removeAriaLabelledBy(this.headingId);
  }

  close(): void {
    this.ref?.close();
  }

  private container(): CdkDialogContainer | null {
    const container = this.ref?.containerInstance;
    return container instanceof CdkDialogContainer ? container : null;
  }
}

/** Footer row of a ui-dialog. */
@Component({
  selector: '[uiDialogFooter]',
  template: '<ng-content />',
  host: { class: 'ui-dialog__footer' },
})
export class UiDialogFooter {}
