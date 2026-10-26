/**
 * O*NET Interest Profiler Short Form scoring, exactly as in the IP Manual (2021):
 * - Chapter 3: answers 0-4 (Strongly Dislike .. Strongly Like), summed per RIASEC area (0-40).
 * - Chapter 7: careers ranked by Pearson r between the person's 6 scores and the career's
 *   O*NET Interest profile; Best Fit r >= .729 (p < .05), Great Fit r >= .608 (p < .10),
 *   Good Fit r >= 0; shown by Job Zone, 10 per Job Zone, sorted by fit then A-Z.
 * Do not change items, wording or these rules (CC BY-ND 4.0).
 */
import ip from "@/data/tests/interest-profiler.json";
import { pearson, RIASEC, type RiasecLetter, type RiasecScores } from "./stats";

export type IpAnswer = 0 | 1 | 2 | 3 | 4;
export type IpAnswers = Record<number, IpAnswer>; // item id -> answer
export type Fit = "Best Fit" | "Great Fit" | "Good Fit";

export interface CareerInterest {
  code: string;
  title: string;
  job_zone: number | null;
  riasec: Record<string, number>;
}

export interface IpResult {
  scores: RiasecScores;
  /** Areas from highest to lowest; ties keep R-I-A-S-E-C order. */
  ranked: RiasecLetter[];
  /** Areas tied with another area, so the user can choose (as the official form says). */
  ties: RiasecLetter[][];
  allStronglyDislike: boolean;
  message: string | null;
}

const FIT = ip.scoring.occupation_link.fit;
const BEST = FIT[0]!.min_r;
const GREAT = FIT[1]!.min_r;
const PER_ZONE = ip.scoring.occupation_link.target_per_job_zone;

export function scoreInterestProfiler(answers: IpAnswers): IpResult {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } as RiasecScores;
  let answered = 0;
  let allZero = true;
  for (const item of ip.items) {
    const a = answers[item.id];
    if (a === undefined) throw new Error(`Interest Profiler: item ${item.id} not answered`);
    if (![0, 1, 2, 3, 4].includes(a)) throw new Error(`Interest Profiler: bad answer ${a} for item ${item.id}`);
    scores[item.area as RiasecLetter] += a;
    answered++;
    if (a !== 0) allZero = false;
  }
  if (answered !== 60) throw new Error("Interest Profiler: 60 answers required");
  const ranked = [...RIASEC].sort((x, y) => scores[y] - scores[x]);
  const groups = new Map<number, RiasecLetter[]>();
  for (const L of RIASEC) groups.set(scores[L], [...(groups.get(scores[L]) ?? []), L]);
  const ties = [...groups.values()].filter((g) => g.length > 1);
  return {
    scores,
    ranked,
    ties,
    allStronglyDislike: allZero,
    message: allZero ? ip.scoring.all_strongly_dislike_message : null,
  };
}

export function fitLabel(r: number): Fit | null {
  if (r >= BEST) return "Best Fit";
  if (r >= GREAT) return "Great Fit";
  if (r >= 0) return "Good Fit";
  return null;
}

export interface IpMatch {
  code: string;
  title: string;
  r: number;
  fit: Fit;
}

/** Official linkage: careers per Job Zone. Returns null r for flat profiles (all areas equal). */
export function matchCareersByJobZone(scores: RiasecScores, careers: CareerInterest[]): Record<number, IpMatch[]> {
  const person = RIASEC.map((L) => scores[L]);
  const byZone: Record<number, IpMatch[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const c of careers) {
    if (!c.job_zone) continue;
    const occ = RIASEC.map((L) => c.riasec[L] ?? NaN);
    if (occ.some(Number.isNaN)) continue;
    const r = pearson(person, occ);
    if (r === null) continue;
    const fit = fitLabel(r);
    if (!fit) continue;
    byZone[c.job_zone]!.push({ code: c.code, title: c.title, r, fit });
  }
  const order: Record<Fit, number> = { "Best Fit": 0, "Great Fit": 1, "Good Fit": 2 };
  for (const z of Object.keys(byZone)) {
    const list = byZone[+z]!;
    // Strong (Best/Great) matches all count; fill to 10 with the next highest non-negative r.
    const strong = list.filter((m) => m.fit !== "Good Fit");
    const rest = list.filter((m) => m.fit === "Good Fit").sort((a, b) => b.r - a.r);
    const chosen = strong.length >= PER_ZONE ? strong : [...strong, ...rest.slice(0, PER_ZONE - strong.length)];
    chosen.sort((a, b) => order[a.fit] - order[b.fit] || a.title.localeCompare(b.title));
    byZone[+z] = chosen;
  }
  return byZone;
}

/** Interest fit 0-1 for our combined ranking (r below 0 counts as 0). */
export function interestFit(scores: RiasecScores, riasec: Record<string, number>): number {
  const r = pearson(
    RIASEC.map((L) => scores[L]),
    RIASEC.map((L) => riasec[L] ?? 0),
  );
  return r === null ? 0 : Math.max(0, r);
}

export const IP_ATTRIBUTION = ip.license.attribution;
