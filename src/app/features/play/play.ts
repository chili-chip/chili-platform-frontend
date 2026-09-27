import { Component, effect, ElementRef, inject, input, OnDestroy, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameProject } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { marketError } from '../marketplace/market-utils';
import { downloadBitsy, loadCitsyPlayer } from './bitsy-file';

@Component({
  selector: 'app-play',
  imports: [RouterLink],
  templateUrl: './play.html',
  styleUrl: './play.scss',
})
export class PlayComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly id = input.required<string>();
  readonly game = signal<GameProject | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('screen');
  private startedFor = '';
  private alive = true;

  constructor() {
    effect(() => {
      const id = this.id();
      this.loading.set(true);
      this.error.set('');
      this.game.set(null);
      this.startedFor = '';
      window.CitsyPlayer?.stop();
      this.api.getGame(id).subscribe({
        next: (game) => {
          if (this.id() !== id) {
            return;
          }
          this.game.set(game);
          this.loading.set(false);
          if (!game.data) {
            this.error.set('This copy has no Bitsy file to play.');
          }
        },
        error: (err) => {
          if (this.id() !== id) {
            return;
          }
          this.loading.set(false);
          this.error.set(marketError(err, 'Could not open this game.'));
        },
      });
    });

    effect(() => {
      const canvas = this.canvas();
      const game = this.game();
      if (!canvas || !game?.data || this.startedFor === String(game.id)) {
        return;
      }
      const token = String(game.id);
      this.startedFor = token;
      const node = canvas.nativeElement;
      const data = game.data;
      void loadCitsyPlayer()
        .then((player) => {
          if (!this.alive || this.startedFor !== token) {
            return;
          }
          player.stop();
          player.start(node, data);
        })
        .catch((err: unknown) => {
          this.error.set(err instanceof Error ? err.message : 'Could not start the player.');
        });
    });
  }

  ngOnDestroy(): void {
    this.alive = false;
    window.CitsyPlayer?.stop();
  }

  download(): void {
    const game = this.game();
    if (!game?.data) {
      return;
    }
    downloadBitsy(game.slug, game.data);
  }
}
