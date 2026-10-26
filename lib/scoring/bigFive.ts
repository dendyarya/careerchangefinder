/**
 * IPIP Big-Five Factor Markers, 50 items (public domain, ipip.ori.org).
 * Scoring per IPIP instructions: +keyed 1-5, -keyed 6 minus answer, summed per factor (10-50).
 * Bands are thirds of the possible range, not population norms.
 */
import b5 from "@/data/tests/big-five-ipip50.json";

export type B5Answer = 1 | 2 | 3 | 4 | 5;
export type B5Answers = Record<number, B5Answer>;
export type FactorId = "extraversion" | "agreeableness" | "conscientiousness" | "emotional-stability" | "openness";
export type Band = "low" | "medium" | "high";

export interface FactorScore {
  id: FactorId;
  name: string;
  score: number; // 10-50
  /** 0-1 position within the possible range */
  position: number;
  band: Band;
}

const BANDS = b5.scoring.bands as Record<Band, [number, number]>;

export function band(score: number): Band {
  for (const b of ["low", "medium", "high"] as Band[]) {
    const [lo, hi] = BANDS[b];
    if (score >= lo && score <= hi) return b;
  }
  throw new Error(`Big Five: score ${score} out of range`);
}

/** Score all factors, or only the listed factors (College Major Quiz uses two). */
export function scoreBigFive(answers: B5Answers, only?: FactorId[]): Record<string, FactorScore> {
  const out: Record<string, FactorScore> = {};
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const item of b5.items) {
    const fid = item.factor_id as FactorId;
    if (only && !only.includes(fid)) continue;
    const a = answers[item.id];
    if (a === undefined) throw new Error(`Big Five: item ${item.id} not answered`);
    if (![1, 2, 3, 4, 5].includes(a)) throw new Error(`Big Five: bad answer ${a} for item ${item.id}`);
    const v = item.key === "+" ? a : 6 - a;
    sums[fid] = (sums[fid] ?? 0) + v;
    counts[fid] = (counts[fid] ?? 0) + 1;
  }
  for (const [k, f] of Object.entries(b5.factors)) {
    const fid = f.id as FactorId;
    if (only && !only.includes(fid)) continue;
    if (counts[fid] !== 10) throw new Error(`Big Five: factor ${fid} needs 10 answers`);
    const score = sums[fid]!;
    out[fid] = { id: fid, name: f.name, score, position: (score - 10) / 40, band: band(score) };
    void k;
  }
  return out;
}

/** Item ids needed for the given factors. */
export function itemsFor(factors: FactorId[]): number[] {
  return b5.items.filter((i) => factors.includes(i.factor_id as FactorId)).map((i) => i.id);
}
