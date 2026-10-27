/**
 * Open Graph cards (runbook Tahap 6): /og/<page path>.png for data pages, a fixed default card for the rest.
 * Only paths that resolve to a real page get a card; anything else is 404, so the image route cannot be
 * used to render arbitrary text or fill the cache.
 */
const PATTERNS: RegExp[] = [
  /^\/careers\/[a-z0-9-]+$/,
  /^\/careers\/[a-z0-9-]+\/salary$/,
  /^\/careers\/[a-z0-9-]+\/salary\/[a-z-]+$/,
  /^\/careers\/(industry|education|personality|holland-code|salary)\/[a-z0-9-]+$/,
  /^\/career-change\/(from|at|to)-[a-z0-9-]+$/,
  /^\/jobs-similar-to\/[a-z0-9-]+$/,
];

export const OG_DEFAULT = "/og-default.png";

export function ogImageFor(path: string): string {
  return PATTERNS.some((p) => p.test(path)) ? `/og${path}.png` : OG_DEFAULT;
}

export interface OgCard {
  eyebrow: string;
  title: string;
  stat?: { label: string; value: string };
}
