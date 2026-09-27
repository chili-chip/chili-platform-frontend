import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game-tile',
  imports: [NgTemplateOutlet, RouterLink],
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
}
