import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DISCORD_URL, HELP_ARTICLES, HELP_TOPICS, HelpArticle } from './help-articles';

@Component({
  selector: 'app-help',
  imports: [RouterLink],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class HelpComponent {
  readonly discordUrl = DISCORD_URL;
  readonly query = signal('');

  /** Articles grouped by topic, in topic order. Empty topics are left out. */
  readonly groups = computed(() =>
    HELP_TOPICS.map((topic) => ({
      topic,
      articles: HELP_ARTICLES.filter((article) => article.topic === topic.slug),
    })).filter((group) => group.articles.length),
  );

  readonly results = computed(() => {
    const words = this.query().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) {
      return null;
    }
    return HELP_ARTICLES.filter((article) => {
      const haystack = `${article.title} ${article.summary} ${article.body}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  });

  topicTitle(article: HelpArticle): string {
    return HELP_TOPICS.find((topic) => topic.slug === article.topic)?.title ?? '';
  }
}
