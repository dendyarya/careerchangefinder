/**
 * Career Match (our own questions) and the combined Free Career Test ranking.
 * Fit per question = 1 - |target - career percentile| (O*NET Work Context / BLS pay).
 * Career Match = weighted mean of fits x 100. "Doesn't matter" (target null) has weight 0.
 * The education question is a filter on Job Zone.
 */
import cm from "@/data/tests/career-match.json";
import { interestFit } from "./interestProfiler";
import type { RiasecScores } from "./stats";

export type CmAnswers = Record<string, number>; // question id -> option index

export interface CareerAttrs {
  code: string;
  slug: string;
  title: string;
  job_zone: number | null;
  riasec: Record<string, number>;
  median: number | null;
  attrs: Record<string, number | null>;
}

interface Pref {
  attr: string;
  target: number;
  weight: number;
}

export interface CmPrefs {
  prefs: Pref[];
  maxJobZone: number;
}

export function readAnswers(answers: CmAnswers): CmPrefs {
  const prefs: Pref[] = [];
  let maxJobZone = 5;
  for (const q of cm.questions) {
    const idx = answers[q.id];
    if (idx === undefined) throw new Error(`Career Match: ${q.id} not answered`);
    const opt = q.options[idx] as { target?: number | null; weight?: number; max_job_zone?: number } | undefined;
    if (!opt) throw new Error(`Career Match: bad option ${idx} for ${q.id}`);
    if ("filter" in q && q.filter) {
      maxJobZone = opt.max_job_zone ?? 5;
      continue;
    }
    if (opt.target === null || opt.target === undefined) continue;
    prefs.push({ attr: q.attr, target: opt.target, weight: opt.weight ?? 1 });
  }
  return { prefs, maxJobZone };
}

/** 0-100, or null when no preference applies to this career (all "Doesn't matter" or no data). */
export function careerMatchScore(p: CmPrefs, c: CareerAttrs): number | null {
  let sum = 0;
  let w = 0;
  for (const pref of p.prefs) {
    const v = c.attrs[pref.attr];
    if (v === null || v === undefined) continue; // no O*NET data for this attribute
    sum += pref.weight * (1 - Math.abs(pref.target - v));
    w += pref.weight;
  }
  return w === 0 ? null : (sum / w) * 100;
}

export interface CombinedResult {
  code: string;
  slug: string;
  title: string;
  job_zone: number | null;
  score: number; // 0-99
  interest: number; // 0-100
  careerMatch: number | null;
}

export const INTEREST_WEIGHT = 0.6;

/** Our Free Career Test ranking. Careers above the chosen Job Zone are left out. */
export function rankCareers(scores: RiasecScores, p: CmPrefs, careers: CareerAttrs[], topN = 20): CombinedResult[] {
  const out: CombinedResult[] = [];
  for (const c of careers) {
    if (!c.job_zone || c.job_zone > p.maxJobZone) continue;
    const interest = interestFit(scores, c.riasec) * 100;
    const match = careerMatchScore(p, c);
    const score = match === null ? interest : INTEREST_WEIGHT * interest + (1 - INTEREST_WEIGHT) * match;
    out.push({
      code: c.code,
      slug: c.slug,
      title: c.title,
      job_zone: c.job_zone,
      score: Math.min(99, Math.round(score)),
      interest: Math.round(interest),
      careerMatch: match === null ? null : Math.round(match),
    });
  }
  out.sort((a, b) => b.score - a.score || b.interest - a.interest || a.title.localeCompare(b.title));
  return out.slice(0, topN);
}
