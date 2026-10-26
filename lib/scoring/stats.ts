/** Pearson correlation of two equal-length vectors. Returns null if either has no variation. */
export function pearson(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length === 0) throw new Error("pearson: vectors must have the same, non-zero length");
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i]! - ma;
    const y = b[i]! - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
}

export const RIASEC = ["R", "I", "A", "S", "E", "C"] as const;
export type RiasecLetter = (typeof RIASEC)[number];
export type RiasecScores = Record<RiasecLetter, number>;
