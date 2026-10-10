import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ForumPost, MarketplaceListing, StoreProduct } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DOCS_URL, SOCIAL_LINKS } from '../../core/socials';
import { GameTileComponent } from '../../shared/game-tile/game-tile';
import {
  MediaFadeDirective,
  SkeletonGridComponent,
  SkeletonRowsComponent,
  SkeletonThreadsComponent,
} from '../../shared/loading';
import { UI } from '../../shared/ui';
import { formatPrice } from '../marketplace/market-utils';
import { productBlurb, productCover, unwrapList } from '../store/store-utils';
import { ConsoleStageComponent } from './console-stage';

/** `null` while loading. A section that fails to load is hidden rather than shown broken. */
type Feed<T> = T[] | null;

const FEATURED_GAMES = 4;
const STORE_CALLOUTS = 3;
const RECENT_THREADS = 4;

@Component({
  selector: 'app-landing-page',
  imports: [
    UI,
    ConsoleStageComponent,
    DatePipe,
    GameTileComponent,
    MediaFadeDirective,
    RouterLink,
    SkeletonGridComponent,
    SkeletonRowsComponent,
    SkeletonThreadsComponent,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly games = signal<Feed<MarketplaceListing>>(null);
  readonly gamesFailed = signal(false);
  readonly products = signal<Feed<StoreProduct>>(null);
  readonly productsFailed = signal(false);
  readonly threads = signal<Feed<ForumPost>>(null);
  readonly threadsFailed = signal(false);

  readonly docsUrl = DOCS_URL;
  readonly socials = SOCIAL_LINKS;
  readonly discordUrl = SOCIAL_LINKS.find((link) => link.label === 'Discord')?.url ?? '';
  readonly priceLabel = formatPrice;
  readonly cover = productCover;
  readonly blurb = productBlurb;

  readonly specs = [
    {
      title: '1.5″ color OLED screen',
      body: 'A square display with a resolution of 128×128 pixels.',
    },
    {
      title: 'RP2350 MCU',
      body: 'The brain of the console. Low power, yet high performance.',
    },
    {
      title: 'Four arrow buttons',
      body: 'A separated cross, placed for a thumb on the left.',
    },
    {
      title: 'A, B, X, Y',
      body: 'Four face buttons for play, confirm, and cart shortcuts.',
    },
    {
      title: 'Menu and Home',
      body: 'Leave a game, or come back to the handheld.',
    },
    {
      title: 'Buzzer speaker',
      body: 'Chiptune stings, hits, and the beeps between rooms.',
    },
    {
      title: 'LiPo · about 9 hours',
      body: 'A cell sized for a long session of play.',
    },
  ];

  readonly nextSteps = [
    {
      kicker: 'Play',
      title: 'Play a game',
      copy: 'Indie carts that run in the browser and on the handheld.',
      to: '/marketplace',
    },
    {
      kicker: 'Build',
      title: 'Buy hardware',
      copy: 'Boards, kits, and parts for the vgc zero, shipped in the EU.',
      to: '/store',
    },
    {
      kicker: 'Create',
      title: 'Create with Bitsy',
      copy: 'Rooms, sprites, and dialogue in the browser. No code needed.',
      to: '/creator',
    },
  ];

  ngOnInit(): void {
    this.api.listMarketplaceListings({ sort: 'new' }).subscribe({
      next: (payload) => this.games.set((payload.results ?? []).slice(0, FEATURED_GAMES)),
      error: () => this.gamesFailed.set(true),
    });
    this.api.listProducts().subscribe({
      next: (payload) =>
        this.products.set(
          unwrapList(payload)
            .filter((product) => product.is_active)
            .slice(0, STORE_CALLOUTS),
        ),
      error: () => this.productsFailed.set(true),
    });
    this.api.listPosts().subscribe({
      next: (payload) => this.threads.set((payload.results ?? []).slice(0, RECENT_THREADS)),
      error: () => this.threadsFailed.set(true),
    });
  }
}
