import { Injectable } from '@angular/core';

import { CACHE_TTL_MS, TIMELINE_LABEL, TIMELINE_REPOS, TimelineRepo } from './timeline-config';

export type TimelineType = 'plan' | 'release';

export interface TimelineEntry {
  type: TimelineType;
  title: string;
  /** ISO date-time. Releases: when it shipped. Plans: when the issue was opened. */
  date: string;
  /** Repository label, e.g. "Platform". */
  source: string;
  link: { label: string; url: string };
}

interface GithubRelease {
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string | null;
  draft: boolean;
}

/** The issues endpoint returns pull requests too, marked by `pull_request`. */
interface GithubIssue {
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  pull_request?: { merged_at: string | null };
}

const API = 'https://api.github.com';
const CACHE_KEY = 'chili.timeline.v2';

/**
 * Builds the timeline from GitHub: published releases, plus pull requests and issues that carry
 * `TIMELINE_LABEL` (merged pull requests as releases, open issues as plans).
 *
 * Uses `fetch` rather than `HttpClient` on purpose: the app's auth interceptor adds the user's
 * login token to every `HttpClient` request, and it must never be sent to GitHub.
 */
@Injectable({ providedIn: 'root' })
export class TimelineService {
  async load(signal?: AbortSignal): Promise<TimelineEntry[]> {
    const cached = this.readCache();
    if (cached) {
      return cached;
    }
    const perRepo = await Promise.all(TIMELINE_REPOS.map((repo) => this.loadRepo(repo, signal)));
    const entries = perRepo.flat().sort((a, b) => b.date.localeCompare(a.date));
    this.writeCache(entries);
    return entries;
  }

  private async loadRepo(repo: TimelineRepo, signal?: AbortSignal): Promise<TimelineEntry[]> {
    const base = `${API}/repos/${repo.owner}/${repo.name}`;
    const [releases, labeled] = await Promise.all([
      this.get<GithubRelease[]>(`${base}/releases?per_page=50`, signal),
      this.get<GithubIssue[]>(
        `${base}/issues?labels=${encodeURIComponent(TIMELINE_LABEL)}&state=all&per_page=100`,
        signal,
      ),
    ]);

    const entries: TimelineEntry[] = [];

    for (const item of releases) {
      if (item.draft || !item.published_at) {
        continue;
      }
      entries.push({
        type: 'release',
        title: item.name || item.tag_name,
        date: item.published_at,
        source: repo.label,
        link: { label: `Release ${item.tag_name}`, url: item.html_url },
      });
    }

    for (const item of labeled) {
      if (item.pull_request) {
        if (item.pull_request.merged_at) {
          entries.push({
            type: 'release',
            title: item.title,
            date: item.pull_request.merged_at,
            source: repo.label,
            link: { label: `Pull request #${item.number}`, url: item.html_url },
          });
        }
      } else if (item.state === 'open') {
        entries.push({
          type: 'plan',
          title: item.title,
          date: item.created_at,
          source: repo.label,
          link: { label: `Issue #${item.number}`, url: item.html_url },
        });
      }
    }

    return entries;
  }

  private async get<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) {
      throw new Error(`GitHub responded ${response.status}`);
    }
    return (await response.json()) as T;
  }

  private readCache(): TimelineEntry[] | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as { at: number; entries: TimelineEntry[] };
      return Date.now() - parsed.at < CACHE_TTL_MS ? parsed.entries : null;
    } catch {
      return null;
    }
  }

  private writeCache(entries: TimelineEntry[]): void {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), entries }));
    } catch {
      // Storage can be unavailable (private mode, quota); the timeline still works without it.
    }
  }
}
