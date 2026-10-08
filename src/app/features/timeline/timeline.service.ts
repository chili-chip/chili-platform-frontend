import { Injectable } from '@angular/core';

import { CACHE_TTL_MS, HIDE_LABEL, TIMELINE_REPOS, TimelineRepo } from './timeline-config';

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

interface GithubLabel {
  name: string;
}

interface GithubRelease {
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  labels?: GithubLabel[];
}

interface GithubPull {
  number: number;
  title: string;
  html_url: string;
  merged_at: string | null;
  labels: GithubLabel[];
}

interface GithubIssue {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  labels: GithubLabel[];
  pull_request?: unknown;
}

const API = 'https://api.github.com';
const CACHE_KEY = 'chili.timeline.v1';

/**
 * Builds the timeline from GitHub: releases (or merged pull requests when a repository has no
 * releases) and open issues as plans.
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
    const [releases, pulls, issues] = await Promise.all([
      this.get<GithubRelease[]>(`${base}/releases?per_page=50`, signal),
      this.get<GithubPull[]>(
        `${base}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=50`,
        signal,
      ),
      this.get<GithubIssue[]>(`${base}/issues?state=open&per_page=50`, signal),
    ]);

    const shipped: TimelineEntry[] = releases.length
      ? releases
          .filter((item) => !item.draft && item.published_at && !hidden(item.labels))
          .map((item) => ({
            type: 'release' as const,
            title: item.name || item.tag_name,
            date: item.published_at as string,
            source: repo.label,
            link: { label: `Release ${item.tag_name}`, url: item.html_url },
          }))
      : pulls
          .filter((item) => item.merged_at && !hidden(item.labels))
          .map((item) => ({
            type: 'release' as const,
            title: item.title,
            date: item.merged_at as string,
            source: repo.label,
            link: { label: `Pull request #${item.number}`, url: item.html_url },
          }));

    const planned: TimelineEntry[] = issues
      .filter((item) => !item.pull_request && !hidden(item.labels))
      .map((item) => ({
        type: 'plan' as const,
        title: item.title,
        date: item.created_at,
        source: repo.label,
        link: { label: `Issue #${item.number}`, url: item.html_url },
      }));

    return [...shipped, ...planned];
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

function hidden(labels: GithubLabel[] | undefined): boolean {
  return (labels ?? []).some((label) => label.name === HIDE_LABEL);
}
