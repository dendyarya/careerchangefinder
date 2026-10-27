/**
 * Staged publishing: config/published.json says which pages are live per section.
 * Unpublished pages are not generated (404) and are left out of the sitemap.
 */
import published from "@/config/published.json";

export type Section =
  | "career-change-from"
  | "career-change-situations"
  | "careers"
  | "careers-listings"
  | "jobs-similar-to"
  | "salary"
  | "salary-states"
  | "tests"
  | "guides";

const cfg = published as unknown as Record<Section, "all" | string[]>;

export function isPublished(section: Section, slug: string): boolean {
  const v = cfg[section];
  return v === "all" || (Array.isArray(v) && v.includes(slug));
}

export const onlyPublished = <T>(section: Section, items: T[], slugOf: (t: T) => string): T[] =>
  items.filter((t) => isPublished(section, slugOf(t)));
