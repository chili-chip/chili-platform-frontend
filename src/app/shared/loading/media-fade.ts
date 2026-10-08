import { Directive, ElementRef, inject, OnInit } from '@angular/core';

/**
 * Put on an `<img>` that sits inside a placeholder surface (the `.shot` /
 * `.cover` boxes already have a gradient behind them). The image stays
 * transparent until it has loaded, then fades in, so there is no pop-in.
 * If the image fails, it is revealed anyway so the browser's broken-image
 * handling and alt text still work.
 *
 * Transitions are removed under `prefers-reduced-motion` (see styles.scss).
 */
@Directive({
  selector: 'img[appMediaFade]',
  host: {
    '(load)': 'reveal()',
    '(error)': 'reveal()',
  },
})
export class MediaFadeDirective implements OnInit {
  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  ngOnInit(): void {
    this.img.classList.add('media-fade');
    if (this.img.complete && this.img.naturalWidth > 0) {
      this.reveal();
    }
  }

  protected reveal(): void {
    this.img.classList.add('is-loaded');
  }
}
