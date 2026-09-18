import { Component } from '@angular/core';

@Component({
  selector: 'app-store',
  template: `
    <section class="placeholder">
      <p class="kicker">Chilichip</p>
      <h1>Store</h1>
      <p>Preorders, kits, and accessories for the vgc zero land here next.</p>
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
export class StoreComponent {}
