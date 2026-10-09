import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** − n + stepper with a Remove link, for cart lines. */
@Component({
  selector: 'ui-quantity',
  template: `
    <button
      type="button"
      class="ui-quantity__step"
      [attr.aria-label]="'Fewer ' + label()"
      [disabled]="value() <= min()"
      (click)="valueChange.emit(value() - 1)"
    >
      −
    </button>
    <span class="ui-quantity__value" aria-live="polite">{{ value() }}</span>
    <button
      type="button"
      class="ui-quantity__step"
      [attr.aria-label]="'More ' + label()"
      [disabled]="value() >= max()"
      (click)="valueChange.emit(value() + 1)"
    >
      +
    </button>
    <button type="button" class="ui-quantity__remove" (click)="remove.emit()">Remove</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-quantity' },
})
export class UiQuantity {
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input(Infinity);
  /** What is being counted, for screen readers ("Fewer vgc zero kit"). */
  readonly label = input('');
  readonly valueChange = output<number>();
  readonly remove = output<void>();
}
