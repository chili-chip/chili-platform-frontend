import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import { marked } from 'marked';

/**
 * Markdown text from the API (written in the admin's markdown editor or by users).
 * Angular sanitizes the HTML bound to innerHTML, so scripts and event handlers are dropped.
 */
@Component({
  selector: 'app-markdown',
  template: '',
  styles: 'app-markdown { display: block; }',
  // The body is rendered with innerHTML, so its elements need unscoped styles.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'markdown ui-prose', '[innerHTML]': 'html()' },
})
export class MarkdownComponent {
  readonly text = input<string | null | undefined>('');
  /** Single newlines become line breaks, for text typed into a plain textarea. */
  readonly breaks = input(false);

  readonly html = computed(() => {
    const text = (this.text() || '').trim();
    return text ? marked.parse(text, { async: false, gfm: true, breaks: this.breaks() }) : '';
  });
}
