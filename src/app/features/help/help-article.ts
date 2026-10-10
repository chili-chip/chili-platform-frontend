import { Component, computed, effect, inject, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marked } from 'marked';
import { map } from 'rxjs';

import { DISCORD_URL, HELP_ARTICLES, HELP_TOPICS, HelpArticle } from './help-articles';
import { UI } from '../../shared/ui';

@Component({
  selector: 'app-help-article',
  imports: [UI, RouterLink],
  templateUrl: './help-article.html',
  styleUrl: './help-article.scss',
  // The body is rendered from Markdown with innerHTML, so its elements need unscoped styles.
  encapsulation: ViewEncapsulation.None,
})
export class HelpArticleComponent {
  readonly discordUrl = DISCORD_URL;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );

  readonly article = computed(
    () => HELP_ARTICLES.find((item) => item.slug === this.slug()) ?? null,
  );

  readonly topic = computed(() => {
    const article = this.article();
    return article ? HELP_TOPICS.find((topic) => topic.slug === article.topic) : undefined;
  });

  readonly related = computed(() => {
    const slugs = this.article()?.related ?? [];
    return slugs
      .map((slug) => HELP_ARTICLES.find((item) => item.slug === slug))
      .filter((item): item is HelpArticle => Boolean(item));
  });

  readonly html = computed(() => {
    const article = this.article();
    if (!article) {
      return '';
    }
    try {
      return marked.parse(article.body.trim(), { async: false });
    } catch {
      // A malformed article should still be readable.
      return `<p>${escapeHtml(article.body)}</p>`;
    }
  });

  constructor() {
    effect(() => {
      const article = this.article();
      this.title.setTitle(article ? `${article.title} · Help` : 'Help article not found');
    });
  }

  /** Links in the body are plain anchors: keep in-app links in the SPA, open others in a new tab. */
  onBodyClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!anchor || !href || event.defaultPrevented) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      event.preventDefault();
      void this.router.navigateByUrl(href);
    } else if (/^https?:\/\//.test(href)) {
      event.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
