/**
 * Data studies (/research/...). better-paying-careers and same-job-different-pay. Numbers come from data/processed/studies/<slug>.json, written by
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

export interface StatePayPoint {
  abbr: string;
  state: string;
  median: number;
}
export interface CareerGap {
  slug: string;
  title: string;
  median: number;
  employment: number;
  states: number;
  high: StatePayPoint;
  low: StatePayPoint;
  gap: number;
}
export interface SameJobState {
  abbr: string;
  state: string;
  careers: number;
  index: number;
  share_above: number;
  top_in: number;
}
export interface SameJobStudy {
  slug: string;
  rules: { min_employment: number; max_rse: number; min_states: number };
  national: {
    careers: number;
    workers: number;
    median_gap: number;
    careers_double: number;
    share_double: number;
    workers_double: number;
    share_workers_double: number;
    careers_50: number;
    share_50: number;
  };
  largest: CareerGap[];
  widest: CareerGap[];
  narrowest: CareerGap[];
  states: SameJobState[];
}

let sjCache: SameJobStudy | null = null;
export function sameJobStudy(): SameJobStudy {
  sjCache ??= JSON.parse(fs.readFileSync(path.join(DIR, "same-job-different-pay.json"), "utf8")) as SameJobStudy;
  return sjCache;
}

export const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;
export const millions = (n: number) => `${(n / 1e6).toFixed(1)} million`;

export const STUDIES = [
  {
    slug: "better-paying-careers",
    title: "Better-Paying Careers Within Reach: A Data Study",
    published: "2026-10-28",
  },
  {
    slug: "same-job-different-pay",
    title: "Same Job, Different Pay: How Your State Changes Your Salary",
    published: "2026-11-11",
  },
] as const;
