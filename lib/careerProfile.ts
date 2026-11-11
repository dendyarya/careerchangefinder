/** Builds the career profile page model (/careers/[slug]) from data/processed and data/tests. */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  displayName,
  hubData,
  HUB_SLUGS,
  occBySlug,
  occupations,
  singleCodeHubRedirects,
  transitionsFor,
  type Occupation,
} from "@/lib/data/server";
import { type CareerContent, readContent } from "@/lib/content";
import { clip, inSentence, money } from "@/lib/format";
import { fitTitle, seoName } from "@/lib/seoName";
import { socGroupOf } from "@/lib/soc";
import { isPublished } from "@/lib/published";

const P = path.join(process.cwd(), "data");

export interface StatePay {
  state: string;
  abbr: string;
  median: number;
  p10: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  /** BLS H_MEDIAN (null when BLS publishes annual pay only) */
  hourly_median: number | null;
  employment: number | null;
  /** jobs per 1,000 jobs in the state, as published by BLS */
  jobs_per_1000: number | null;
  /** location quotient: the job's share of state employment / its share of U.S. employment */
  lq: number | null;
  /** relative standard error of the employment estimate, % */
  emp_rse: number | null;
}

export function statePay(slug: string): StatePay[] {
  const f = path.join(P, "processed", "wages", `${slug}.json`);
  if (!fs.existsSync(f)) return [];
  return (JSON.parse(fs.readFileSync(f, "utf8")) as { states: StatePay[] }).states;
}

let attrsCache: Map<string, Record<string, number | null>> | null = null;
export function careerAttrs(code: string): Record<string, number | null> | null {
  if (!attrsCache) {
    const d = JSON.parse(fs.readFileSync(path.join(P, "tests", "career-attributes.json"), "utf8")) as {
      careers: { code: string; attrs: Record<string, number | null> }[];
    };
    attrsCache = new Map(d.careers.map((c) => [c.code, c.attrs]));
  }
  return attrsCache.get(code) ?? null;
}

/** Fit-check questions: asked only where this job is clearly high or low on an O*NET Work Context attribute. */
const FIT_QUESTIONS: Record<string, { high: string; low: string }> = {
  contact: {
    high: "Are you happy talking and working with people most of the day?",
    low: "Are you happy working mostly on your own, with little contact with others?",
  },
  public: {
    high: "Do you enjoy serving customers or the public?",
    low: "Would you rather not deal with customers or the public?",
  },
  lead: {
    high: "Do you want to lead or coordinate other people’s work?",
    low: "Do you prefer doing your own work rather than directing others?",
  },
  outdoors: { high: "Are you OK working outdoors in all kinds of weather?", low: "Do you prefer working indoors?" },
  sitting: {
    high: "Are you comfortable sitting at a desk most of the day?",
    low: "Are you OK being on your feet and moving most of the day?",
  },
  time_pressure: {
    high: "Do you work well under tight deadlines?",
    low: "Do you prefer a steady pace without constant deadlines?",
  },
  hazard: {
    high: "Are you OK with physical risk, such as hazardous equipment or conditions, with proper training?",
    low: "Do you want a job with little physical risk?",
  },
  freedom: {
    high: "Do you want a lot of freedom to make your own decisions?",
    low: "Are you comfortable following clear instructions?",
  },
  repetition: {
    high: "Are you OK repeating the same tasks most of the day?",
    low: "Do you want variety, with new tasks often?",
  },
  regular_schedule: { high: "Do you want the same hours every week?", low: "Are you OK with hours that change?" },
  long_hours: {
    high: "Are you OK working more than 40 hours a week?",
    low: "Do you want to stay at 40 hours a week or less?",
  },
};

export interface FitQuestion {
  attr: string;
  text: string;
  percentile: number;
}

export function fitQuestions(code: string): FitQuestion[] {
  const a = careerAttrs(code);
  if (!a) return [];
  const qs: (FitQuestion & { strength: number })[] = [];
  for (const [attr, q] of Object.entries(FIT_QUESTIONS)) {
    const v = a[attr];
    if (v == null) continue;
    if (v >= 0.75) qs.push({ attr, text: q.high, percentile: v, strength: v - 0.5 });
    else if (v <= 0.25) qs.push({ attr, text: q.low, percentile: v, strength: 0.5 - v });
  }
  return qs
    .sort((x, y) => y.strength - x.strength)
    .slice(0, 8)
    .map(({ attr, text, percentile }) => ({ attr, text, percentile }));
}

export function hubForCode(code: string): string | null {
  for (const h of HUB_SLUGS) if (hubData(h)!.codes.includes(code)) return h;
  return null;
}

export interface ProfileModel {
  o: Occupation;
  name: string;
  nameLower: string;
  group: { slug: string; short: string } | null;
  states: StatePay[];
  fit: FitQuestion[];
  out: {
    slug: string;
    title: string;
    match: number;
    median: number | null;
    payChange: number | null;
    group: boolean;
  }[];
  into: { slug: string; title: string; match: number; median: number | null }[];
  fromPage: string | null; // /career-change/from-* page for this job
  title: string;
  description: string;
  /** written text (content/generated/careers), when there is one */
  content: CareerContent | null;
}

export function profileSlugs(): string[] {
  return occupations()
    .map((o) => o.slug)
    .filter((s) => isPublished("careers", s));
}

export function buildProfile(slug: string): ProfileModel | null {
  const o = occBySlug(slug);
  if (!o) return null;
  const name = displayName(o.title);
  const tr = o.thin ? null : transitionsFor(slug);
  const folded = new Map(singleCodeHubRedirects().map((r) => [r.from, r.to]));
  const fromPage = o.thin ? null : `/career-change/from-${folded.get(slug) ?? slug}`;
  const g = socGroupOf(o.code);
  const w = o.wage;
  const pay = w?.median
    ? `median pay ${money(w.median)}${w.is_group ? " (broader BLS group)" : ""}`
    : "pay data not published by BLS";
  const sn = seoName(name, o.code);
  const title = fitTitle(
    [`${name}: Salary, Skills and How to Start`, `${name}: Salary and Skills`, `${name} Career Profile`, name,
     `${sn}: Salary, Skills and How to Start`, `${sn}: Salary and Skills`, `${sn} Career Profile`, sn],
    sn,
  );
  const description = clip(
    `What ${inSentence(name)} do, ${pay}, education, skills and the hard parts of the job, from O*NET 31.0 and BLS May 2025 data.`,
    160,
  );
  return {
    o,
    name,
    nameLower: inSentence(name),
    group: g ? { slug: g.slug, short: g.short } : null,
    states: w ? statePay(slug) : [],
    fit: o.thin ? [] : fitQuestions(o.code),
    out: (tr?.top ?? []).slice(0, 5).map((t) => ({
      slug: t.slug,
      title: t.title,
      match: t.match,
      median: t.median,
      payChange: t.wage_is_group ? null : t.pay_change_pct,
      group: t.wage_is_group,
    })),
    into: ((tr as unknown as { into?: ProfileModel["into"] })?.into ?? []).slice(0, 5),
    fromPage,
    title,
    description,
    content: o.thin ? null : readContent<CareerContent>("careers", slug),
  };
}

/** Profiles that are indexed and go in the sitemap: published and not thin. */
export function careerProfileIndexable(slug: string): boolean {
  const o = occBySlug(slug);
  return Boolean(o && !o.thin && isPublished("careers", slug));
}
