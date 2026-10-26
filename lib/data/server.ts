/**
 * Server-only data access for static pages. Files are read at build time (generateStaticParams +
 * static rendering), so nothing is read from disk when a visitor opens a page.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";

const P = path.join(process.cwd(), "data", "processed");
const readJson = <T>(...parts: string[]): T => JSON.parse(fs.readFileSync(path.join(P, ...parts), "utf8")) as T;

export interface Wage {
  median: number | null;
  p10: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  employment: number | null;
  is_group: boolean;
  bls_code: string;
  bls_title: string;
  top_coded: boolean;
}
export interface Category {
  category: number;
  label: string | null;
  pct: number;
}
export interface FirstStep {
  job_zone: number | null;
  education_label: string | null;
  typical_education?: Category | null;
  on_the_job_training?: Category | null;
  related_experience?: Category | null;
  certification_importance?: number;
  certification_note?: string | null;
}
export interface Downside {
  factor: string;
  label: string;
  value: number;
}
export interface Occupation {
  code: string;
  slug: string;
  title: string;
  description: string;
  alt_titles: string[];
  thin: boolean;
  job_zone: number | null;
  holland: string | null;
  riasec: Record<string, number> | null;
  wage: Wage | null;
  first_step: FirstStep;
  downsides: Downside[];
  contact_with_others: number | null;
  tasks: string[];
  transferable_skills: { name: string; value: number }[];
  essential_skills: { name: string; value: number }[];
  knowledge: { name: string; value: number }[];
  work_styles: string[];
  majors: { cip: string; title: string }[];
  education_dist: { category: number; label: string | null; pct: number }[];
}
export interface TransitionItem {
  code: string;
  slug: string;
  title: string;
  match: number;
  median: number | null;
  pay_change_pct: number | null;
  job_zone: number | null;
  education_label: string | null;
  wage_is_group: boolean;
  wage_source_title: string;
  skill_gaps: string[];
  holland: string | null;
  skill_imp: Record<string, number>;
}
export interface Transitions {
  baseline_median: number | null;
  job_zone: number | null;
  source_skills: { name: string; value: number }[];
  members: { code: string; title: string; slug: string }[];
  top: TransitionItem[];
  similar_in_field: TransitionItem[];
}
export interface HubData extends Transitions {
  slug: string;
  singular: string;
  plural: string;
  codes: string[];
}

let occCache: Occupation[] | null = null;
export function occupations(): Occupation[] {
  occCache ??= readJson<Occupation[]>("occupations.json");
  return occCache;
}
let byCode: Map<string, Occupation> | null = null;
export function occByCode(code: string): Occupation | undefined {
  byCode ??= new Map(occupations().map((o) => [o.code, o]));
  return byCode.get(code);
}
let bySlug: Map<string, Occupation> | null = null;
export function occBySlug(slug: string): Occupation | undefined {
  bySlug ??= new Map(occupations().map((o) => [o.slug, o]));
  return bySlug.get(slug);
}

export const HUB_SLUGS = Object.keys(readJson<Record<string, unknown>>("hubs.json"));
export function hubData(slug: string): HubData | null {
  if (!HUB_SLUGS.includes(slug)) return null;
  return readJson<HubData>("hubs", `${slug}.json`);
}
export function transitionsFor(slug: string): Transitions | null {
  const f = path.join(P, "transitions", `${slug}.json`);
  return fs.existsSync(f) ? readJson<Transitions>("transitions", `${slug}.json`) : null;
}

/** Occupations that are the only member of a hub: their page redirects to the hub (no duplicate content). */
export function singleCodeHubRedirects(): { from: string; to: string }[] {
  return HUB_SLUGS.flatMap((h) => {
    const d = hubData(h)!;
    if (d.codes.length !== 1) return [];
    const o = occByCode(d.codes[0]!);
    return o ? [{ from: o.slug, to: h }] : [];
  });
}

/** Career-change source pages: 12 hubs + every non-thin occupation that is not folded into a hub. */
export function careerChangeSources(): string[] {
  const folded = new Set(singleCodeHubRedirects().map((r) => r.from));
  return [...HUB_SLUGS, ...occupations().filter((o) => !o.thin && !folded.has(o.slug)).map((o) => o.slug)];
}

const LIST_TITLE = /^[^,]+,( [^,]+,)* (and|or) /;
let dupShort: Set<string> | null = null;
/**
 * Name used in headings: "Registered Nurses", "Cooks (Fast Food)" when several jobs share "Cooks",
 * and the full title for list-style names like "Area, Ethnic, and Cultural Studies Teachers".
 */
export function displayName(title: string): string {
  if (LIST_TITLE.test(title)) return title;
  const short = title.split(",")[0]!.trim();
  if (!title.includes(",")) return title;
  if (!dupShort) {
    const counts = new Map<string, number>();
    for (const o of occupations().filter((x) => !x.thin)) {
      const s = o.title.split(",")[0]!.trim();
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    dupShort = new Set([...counts].filter(([, n]) => n > 1).map(([s]) => s));
  }
  if (dupShort.has(short) || !short.includes(" ")) return `${short} (${title.slice(short.length + 1).trim()})`;
  return short;
}
