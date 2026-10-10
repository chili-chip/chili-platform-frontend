import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Text input, textarea or select. `<input uiInput formControlName="email" />` */
@Directive({
  selector: 'input[uiInput], textarea[uiInput], select[uiInput]',
  host: { class: 'ui-input', '[class.ui-input--sm]': 'size() === "sm"' },
})
export class UiInput {
  readonly size = input<'md' | 'sm'>('md');
}

/** Checkbox or radio. `<input type="checkbox" uiCheck />` */
@Directive({
  selector: 'input[type=checkbox][uiCheck], input[type=radio][uiCheck]',
  host: { class: 'ui-check' },
})
export class UiCheck {}

/** A checkbox or radio with its text: `<label uiChoice><input type="checkbox" uiCheck /> Text</label>` */
@Directive({
  selector: 'label[uiChoice]',
  host: { class: 'ui-choice' },
})
export class UiChoice {}

/**
 * A labelled control. The label text and the control are projected; `hint` and
 * `error` render underneath.
 *
 * <label uiField hint="Shown on your profile">
 *   Display name
 *   <input uiInput formControlName="display_name" />
 * </label>
 *
 * Use `<div uiField>` (or `<fieldset uiField>`) around controls that bring their
 * own label, such as the markdown editor.
 */
@Component({
  selector: 'label[uiField], div[uiField], fieldset[uiField]',
  template: `
    <ng-content />
    @if (error()) {
      <span class="ui-field__error" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="ui-field__hint">{{ hint() }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-field' },
})
export class UiField {
  readonly hint = input('');
  readonly error = input('');
}
