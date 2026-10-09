import { Component, inject, signal, TemplateRef } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';
import { SpinnerComponent } from '../../shared/loading';
import { UI, UiDialogService } from '../../shared/ui';

/**
 * Every component in the library with its variants, at /dev/ui. Not linked
 * from the site; use it as the reference when building new pages.
 */
@Component({
  selector: 'app-ui-showcase',
  imports: [UI, SpinnerComponent],
  templateUrl: './ui-showcase.html',
  styleUrl: './ui-showcase.scss',
})
export class UiShowcaseComponent {
  private readonly dialog = inject(UiDialogService);
  readonly toast = inject(ToastService);

  readonly chip = signal('all');
  readonly quantity = signal(2);
  readonly colors = [
    'bg-0',
    'bg-1',
    'line',
    'text',
    'muted',
    'chili',
    'chili-hot',
    'phosphor',
    'amber',
  ];
  readonly sizes = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

  open(content: TemplateRef<unknown>): void {
    this.dialog.open(content);
  }
}
