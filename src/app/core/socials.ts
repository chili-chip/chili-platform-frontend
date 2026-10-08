export interface SocialLink {
  /** Shown in the footer and used as the accessible name. */
  label: string;
  url: string;
}

/** Social and community links shown in the site footer. Add an entry to show another. */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'Discord', url: 'https://discord.gg/xB9sPYKBZc' },
];
