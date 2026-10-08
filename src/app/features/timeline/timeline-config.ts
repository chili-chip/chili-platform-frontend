export interface TimelineRepo {
  owner: string;
  name: string;
  /** Shown on each entry so readers can tell where it came from. */
  label: string;
}

/** Repositories the timeline reads from. Must be public. */
export const TIMELINE_REPOS: readonly TimelineRepo[] = [
  { owner: 'chili-chip', name: 'chili-platform-frontend', label: 'Web' },
  { owner: 'chili-chip', name: 'chili-platform', label: 'API' },
];

/**
 * Only pull requests and issues with this label appear on the timeline.
 * GitHub Releases cannot carry labels, so every published release is shown.
 */
export const TIMELINE_LABEL = 'timeline';

/**
 * Status comes from the item itself, plus one label:
 * - shipped: merged pull request, closed (completed) issue, or published release
 * - in progress: open pull request, or an open issue labeled `in-progress`
 * - planned: any other open issue
 */
export const IN_PROGRESS_LABEL = 'in-progress';

export type TimelineStatus = 'planned' | 'in-progress' | 'shipped';

export const STATUSES: readonly { value: TimelineStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'shipped', label: 'Shipped' },
];

/**
 * Area comes from an `area:<value>` label (e.g. `area:store`). A release gets its area from a
 * tag prefix instead, e.g. `hardware-v1.1.4`. Items without an area show under "All areas" only.
 */
export const AREA_LABEL_PREFIX = 'area:';

export const AREAS: readonly { value: string; label: string }[] = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'store', label: 'Store' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'creator', label: 'Creator' },
  { value: 'community', label: 'Community' },
  { value: 'account', label: 'Account' },
  { value: 'platform', label: 'Platform' },
];

/** How long fetched entries are reused, so reloads do not spend the visitor's API quota. */
export const CACHE_TTL_MS = 10 * 60 * 1000;
