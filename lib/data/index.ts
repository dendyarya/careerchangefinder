/**
 * Typed loaders for data/processed (built by scripts/etl). Imported at build time, so the data
 * is bundled with the app and nothing is read from disk at request time.
 */
import hubsJson from "@/data/processed/hubs.json";
import metaJson from "@/data/processed/meta.json";
import searchJson from "@/data/processed/search-index.json";
import occupationsJson from "@/data/processed/occupations.json";
import type { HubEntry, SearchEntry } from "@/lib/search";

export interface Hub extends HubEntry {
  codes: string[];
  baseline_median: number | null;
}

export interface Meta {
  built_at: string;
  sources: Record<string, string>;
  attribution: Record<string, string>;
  counts: Record<string, number>;
}

interface OccLite {
  code: string;
  slug: string;
  title: string;
  thin: boolean;
  wage: { median: number | null; is_group: boolean; employment: number | null } | null;
}

export const meta = metaJson as unknown as Meta;
export const hubs: Hub[] = Object.values(hubsJson as Record<string, Hub>);

/** Search index for the header search: non-thin careers, pay only when it is the career's own BLS figure. */
export function buildSearchIndex(): SearchEntry[] {
  const occ = new Map((occupationsJson as unknown as OccLite[]).map((o) => [o.slug, o]));
  return (searchJson as { s: string; t: string; a: string[] }[]).map((e) => {
    const o = occ.get(e.s);
    const p = o?.wage && !o.wage.is_group ? o.wage.median : null;
    // group employment covers several jobs, so it is not used for ranking
    return { s: e.s, t: e.t, a: e.a.slice(0, 6), p, e: o?.wage && !o.wage.is_group ? o.wage.employment : null };
  });
}

export const careerCount = (occupationsJson as unknown as OccLite[]).filter((o) => !o.thin).length;
