import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConsoleStageComponent } from './console-stage';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, ConsoleStageComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPageComponent {
  readonly specs = [
    {
      title: '1.5″ color OLED',
      body: 'A square 128×128 panel, the native size of a Bitsy room.',
    },
    {
      title: 'RP2350',
      body: 'The board that runs carts and the tools around them.',
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

  readonly pillars = [
    {
      kicker: '01',
      title: 'Chilichip Store',
      copy: 'Kits, shells, and the parts that keep a handheld honest.',
      to: '/store',
    },
    {
      kicker: '02',
      title: 'Community',
      copy: 'Devlogs, hardware threads, and the people shipping games.',
      to: '/community',
    },
    {
      kicker: '03',
      title: 'Game Creator',
      copy: 'Rooms, sprites, and dialogue in the browser. No code for a Bitsy cart.',
      to: '/creator',
    },
    {
      kicker: '04',
      title: 'Marketplace',
      copy: 'Indie carts to play in the browser and take home to the handheld.',
      to: '/marketplace',
    },
  ];
}
