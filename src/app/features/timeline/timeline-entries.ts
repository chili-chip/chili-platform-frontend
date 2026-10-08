export type TimelineType = 'plan' | 'release';

export interface TimelineEntry {
  type: TimelineType;
  title: string;
  /** ISO date (YYYY-MM-DD). Releases: the day it shipped. Plans: the day it was announced. */
  date: string;
  description: string;
  link?: { label: string; url: string };
}

const REPO = 'https://github.com/chili-chip/chili-platform-frontend';

/**
 * Timeline content, edited by hand. Prefer a link to the GitHub release, blog post, or store
 * listing over repeating long copy here. Order does not matter; the page sorts by date.
 */
export const TIMELINE_ENTRIES: readonly TimelineEntry[] = [
  {
    type: 'release',
    title: 'Loading spinners and skeletons',
    date: '2026-10-08',
    description: 'Pages show placeholders and a progress bar while content loads.',
    link: { label: 'Pull request #26', url: `${REPO}/pull/26` },
  },
  {
    type: 'release',
    title: 'Account settings',
    date: '2026-10-07',
    description: 'Manage your profile, avatar, password, preferences, and privacy.',
    link: { label: 'Pull request #25', url: `${REPO}/pull/25` },
  },
  {
    type: 'release',
    title: 'Terms of service and privacy policy',
    date: '2026-10-04',
    description: 'Draft legal pages, with an acceptance prompt for signed-in users.',
    link: { label: 'Pull request #12', url: `${REPO}/pull/12` },
  },
  {
    type: 'release',
    title: 'Email verification and password reset',
    date: '2026-10-01',
    description: 'Verify your email address and reset a forgotten password.',
    link: { label: 'Pull request #11', url: `${REPO}/pull/11` },
  },
  {
    type: 'release',
    title: 'Game marketplace',
    date: '2026-09-27',
    description: 'Browse, buy, and rate games made with the creator.',
    link: { label: 'Pull request #6', url: `${REPO}/pull/6` },
  },
  {
    type: 'release',
    title: 'Web creator',
    date: '2026-09-25',
    description: 'Make games in the browser with the Bitsy-based creator.',
    link: { label: 'Pull request #4', url: `${REPO}/pull/4` },
  },
  {
    type: 'release',
    title: 'Hardware store',
    date: '2026-09-24',
    description: 'Product catalog, cart, and checkout for vgc zero hardware.',
    link: { label: 'Pull request #2', url: `${REPO}/pull/2` },
  },
  {
    type: 'release',
    title: 'Platform scaffolding',
    date: '2026-09-18',
    description: 'First version of the platform site.',
    link: { label: 'Pull request #1', url: `${REPO}/pull/1` },
  },
  {
    type: 'plan',
    title: 'Delivery options and pricing',
    date: '2026-10-07',
    description: 'Delivery management for store orders.',
    link: { label: 'Issue #23', url: `${REPO}/issues/23` },
  },
  {
    type: 'plan',
    title: 'Store categories, filtering, and search',
    date: '2026-10-07',
    description: 'Find hardware faster as the catalog grows.',
    link: { label: 'Issue #22', url: `${REPO}/issues/22` },
  },
  {
    type: 'plan',
    title: 'Help center',
    date: '2026-10-07',
    description: 'A help center for platform users.',
    link: { label: 'Issue #20', url: `${REPO}/issues/20` },
  },
];
