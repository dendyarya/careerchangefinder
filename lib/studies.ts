/**
 * Data studies (/research/...). Numbers come from data/processed/studies/<slug>.json, written by
 * scripts/etl/build_studies.py and recomputed independently by scripts/etl/verify_studies.py.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data", "processed", "studies");

export interface AreaStats {
  jobs: number;
  jobs_with_move: number;
  share_jobs: number;
  workers: number;
  workers_with_move: number;
  share_workers: number;
  median_closest_raise: number;
}
export interface StateRow extends AreaStats {
  abbr: string;
  state: string;
}
export interface Example {
  slug: string;
  title: string;
  median: number;
  employment: number;
  moves: number;
  to?: { slug: string; title: string; match: number; median: number; raise: number };
}
export interface BetterPayStudy {
  slug: string;
  rules: { raise_min: number; top_n: number };
  national: AreaStats;
  examples: Example[];
  states: StateRow[];
}

let cache: BetterPayStudy | null = null;
export function betterPayStudy(): BetterPayStudy {
  cache ??= JSON.parse(fs.readFileSync(path.join(DIR, "better-paying-careers.json"), "utf8")) as BetterPayStudy;
  return cache;
}

export const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;
export const millions = (n: number) => `${(n / 1e6).toFixed(1)} million`;

export const STUDIES = [
  {
    slug: "better-paying-careers",
    title: "Better-Paying Careers Within Reach: A Data Study",
    published: "2026-10-28",
  },
] as const;
