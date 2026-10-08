export interface TimelineRepo {
  owner: string;
  name: string;
  /** Shown on each entry so readers can tell where it came from. */
  label: string;
}

/** Repositories the timeline reads from. Must be public. */
export const TIMELINE_REPOS: readonly TimelineRepo[] = [
  { owner: 'chili-chip', name: 'chili-platform-frontend', label: 'Platform' },
  { owner: 'chili-chip', name: 'chili-platform', label: 'API' },
];

/**
 * Only pull requests and issues with this label appear on the timeline:
 * - a merged pull request shows as a release,
 * - an open issue shows as a plan.
 * GitHub Releases cannot carry labels, so every published release is shown.
 */
export const TIMELINE_LABEL = 'timeline';

/** How long fetched entries are reused, so reloads do not spend the visitor's API quota. */
export const CACHE_TTL_MS = 10 * 60 * 1000;
