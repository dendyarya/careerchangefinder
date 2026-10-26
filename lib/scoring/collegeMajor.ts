/**
 * College Major Quiz: Interest Profiler scores + IPIP Openness and Conscientiousness.
 * Major profile = mean O*NET Interest profile and trait values of careers linked by the NCES crosswalk.
 */
import cfg from "@/data/tests/college-major-quiz.json";
import type { FactorScore } from "./bigFive";
import { pearson, RIASEC, type RiasecScores } from "./stats";

export interface MajorProfile {
  cip: string;
  title: string;
  slug: string;
  careers: string[];
  riasec: Record<string, number>;
  traits: { openness: number | null; conscientiousness: number | null };
}

export interface MajorResult {
  cip: string;
  slug: string;
  title: string;
  score: number; // 0-99
  interest: number; // 0-100
}

const S = cfg.scoring;

export function scoreMajor(scores: RiasecScores, o: FactorScore, c: FactorScore, m: MajorProfile): MajorResult {
  const r = pearson(RIASEC.map((L) => scores[L]), RIASEC.map((L) => m.riasec[L] ?? 0));
  const interest = r === null ? 0 : Math.max(0, r);
  let total = S.interest_weight * interest;
  let weight = S.interest_weight;
  const tO = m.traits.openness;
  const tC = m.traits.conscientiousness;
  if (tO !== null) { total += S.openness_weight * (1 - Math.abs(o.position - tO)); weight += S.openness_weight; }
  if (tC !== null) { total += S.conscientiousness_weight * (1 - Math.abs(c.position - tC)); weight += S.conscientiousness_weight; }
  const n = m.careers.length;
  const confidence = n / (n + S.confidence_k);
  return { cip: m.cip, slug: m.slug, title: m.title, score: Math.min(99, Math.round((total / weight) * confidence * 100)), interest: Math.round(interest * 100) };
}

export function rankMajors(scores: RiasecScores, o: FactorScore, c: FactorScore, majors: MajorProfile[]): MajorResult[] {
  return majors
    .filter((m) => m.careers.length >= S.min_linked_careers)
    .map((m) => scoreMajor(scores, o, c, m))
    .sort((a, b) => b.score - a.score || b.interest - a.interest || a.title.localeCompare(b.title))
    .slice(0, S.top_n);
}
