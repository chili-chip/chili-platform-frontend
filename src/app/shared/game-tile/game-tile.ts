import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UiBadge } from '../ui/status';
import { UiCover } from '../ui/surface';

@Component({
  selector: 'app-game-tile',
  imports: [NgTemplateOutlet, RouterLink, UiBadge, UiCover],
  // Same classes uiCard sets for `pad="none" elevated interactive`.
  host: { class: 'ui-card ui-card--pad-none ui-card--elevated ui-card--interactive' },
  templateUrl: './game-tile.html',
  styleUrl: './game-tile.scss',
})
export class GameTileComponent {
  readonly title = input.required<string>();
  readonly cover = input('');
  readonly link = input<string | readonly (string | number)[] | null>(null);
  readonly meta = input('');
  readonly badge = input('');
  readonly detail = input('');
  readonly foot = input('');
  readonly ratingAverage = input<number | null>(null);
  readonly ratingCount = input<number | null>(null);

  ratingLine(): string {
    const count = this.ratingCount();
    if (count === null) {
      return '';
    }
    const average = this.ratingAverage();
    const score = average === null ? '—' : average.toFixed(1);
    return `${score} · ${count}`;
  }
}
