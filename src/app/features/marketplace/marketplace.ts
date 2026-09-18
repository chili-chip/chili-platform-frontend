import { Component } from '@angular/core';

@Component({
  selector: 'app-marketplace',
  template: `
    <section class="placeholder">
      <p class="kicker">Digital carts</p>
      <h1>Marketplace</h1>
      <p>Indie releases, in-browser play, and downloads for the handheld — coming online shortly.</p>
    </section>
  `,
  styles: `
    .placeholder {
      padding: 4rem 6vw;
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(2.2rem, 5vw, 4rem);
    }
    p:last-child {
      color: var(--muted);
      max-width: 42ch;
    }
  `,
})
export class MarketplaceComponent {}
