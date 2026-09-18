import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VgcZeroComponent } from '../../shared/vgc-zero/vgc-zero';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, VgcZeroComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPageComponent {
  readonly pillars = [
    {
      kicker: '01',
      title: 'Chilichip Store',
      copy: 'Order the vgc zero, shells, kits, and the parts that keep a handheld honest.',
      to: '/store',
    },
    {
      kicker: '02',
      title: 'Community',
      copy: 'Devlogs, hardware threads, and pixel-art hangouts with the people shipping games.',
      to: '/community',
    },
    {
      kicker: '03',
      title: 'Game Creator',
      copy: 'A browser studio for rooms, sprites, and dialogue — compile a preview for the zero.',
      to: '/creator',
    },
    {
      kicker: '04',
      title: 'Marketplace',
      copy: 'Discover indie carts, play in-browser, and take a build home to the handheld.',
      to: '/marketplace',
    },
  ];
}
