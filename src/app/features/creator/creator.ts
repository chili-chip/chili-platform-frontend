import { Component } from '@angular/core';

@Component({
  selector: 'app-creator',
  template: `
    <section class="placeholder">
      <p class="kicker">Studio</p>
      <h1>Web Creator</h1>
      <p>The Bitsy-inspired room editor will live here. Sign-in is required so drafts can follow you.</p>
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
      max-width: 46ch;
    }
  `,
})
export class CreatorComponent {}
