import { Injectable } from '@angular/core';

import {
  AREA_LABEL_PREFIX,
  AREAS,
  CACHE_TTL_MS,
  IN_PROGRESS_LABEL,
  TIMELINE_LABEL,
  TIMELINE_REPOS,
  TimelineRepo,
  TimelineStatus,
} from './timeline-config';

export interface TimelineEntry {
  status: TimelineStatus;
  /** Area value from `AREAS`, when the item has one. */
  area?: string;
  title: string;
  /** ISO date-time. Shipped: when it shipped. Otherwise: when it was opened. */
  date: string;
  /** Repository label, e.g. "Web". */
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
  state_reason?: string | null;
  created_at: string;
  closed_at?: string | null;
  labels: (string | { name?: string })[];
  pull_request?: { merged_at: string | null };
}

const API = 'https://api.github.com';
const CACHE_KEY = 'chili.timeline.v3';

/**
 * Builds the timeline from GitHub: published releases, plus pull requests and issues that carry
 * `TIMELINE_LABEL`. See `timeline-config.ts` for how status and area are worked out.
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
        status: 'shipped',
        area: areaFromTag(item.tag_name),
        title: item.name || item.tag_name,
        date: item.published_at,
        source: repo.label,
        link: { label: `Release ${item.tag_name}`, url: item.html_url },
      });
    }

    for (const item of labeled) {
      const names = labelNames(item);
      let status: TimelineStatus | null = null;
      let date = item.created_at;
      if (item.pull_request) {
        if (item.pull_request.merged_at) {
          status = 'shipped';
          date = item.pull_request.merged_at;
        } else if (item.state === 'open') {
          status = 'in-progress';
        }
      } else if (item.state === 'open') {
        status = names.includes(IN_PROGRESS_LABEL) ? 'in-progress' : 'planned';
      } else if (item.state_reason === 'completed' && item.closed_at) {
        status = 'shipped';
        date = item.closed_at;
      }
      if (status) {
        const kind = item.pull_request ? 'Pull request' : 'Issue';
        entries.push({
          status,
          area: areaFromLabels(names),
          title: item.title,
          date,
          source: repo.label,
          link: { label: `${kind} #${item.number}`, url: item.html_url },
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

function labelNames(item: GithubIssue): string[] {
  return item.labels.map((label) => (typeof label === 'string' ? label : (label.name ?? '')));
}

function areaFromLabels(names: string[]): string | undefined {
  for (const name of names) {
    if (name.startsWith(AREA_LABEL_PREFIX)) {
      const value = name.slice(AREA_LABEL_PREFIX.length).trim().toLowerCase();
      if (AREAS.some((area) => area.value === value)) {
        return value;
      }
    }
  }
  return undefined;
}

function areaFromTag(tag: string): string | undefined {
  const prefix = tag.toLowerCase().split(/[-/_]/)[0];
  return AREAS.some((area) => area.value === prefix) ? prefix : undefined;
}
