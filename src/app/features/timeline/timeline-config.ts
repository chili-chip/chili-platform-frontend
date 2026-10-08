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

/** Add this label to a pull request, issue, or release on GitHub to keep it off the timeline. */
export const HIDE_LABEL = 'no-timeline';

/** How long fetched entries are reused, so reloads do not spend the visitor's API quota. */
export const CACHE_TTL_MS = 10 * 60 * 1000;
