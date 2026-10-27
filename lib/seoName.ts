/**
 * Shorter career names for <title> tags only (the H1 and page text keep the official O*NET name).
 * 1. data/seo/short-names.json: hand-picked names that are either a shortening of the official title or an
 *    O*NET alternate/reported title (checked by scripts/etl/verify_short_names.py, listed in docs/short-names.md).
 * 2. Otherwise only meaning-preserving rewrites of long O*NET naming patterns.
 * The HTML audit checks that no two pages end up with the same title.
 */
import short from "@/data/seo/short-names.json";

const SHORT = (short as { names: Record<string, string> }).names;

const RULES: [RegExp, string][] = [
  [/ Setters, Operators, and Tenders/g, " Operators"],
  [/ Operators and Tenders/g, " Operators"],
  [/Technologists and Technicians/g, "Technicians"],
  [/, Metal and Plastic$/, " (Metal and Plastic)"],
];

export function seoName(name: string, code?: string): string {
  if (code && SHORT[code]) return SHORT[code];
  let s = name;
  for (const [a, b] of RULES) s = s.replace(a, b);
  return s;
}

/** The short name when it differs from the official one ("Also called …" line under the H1). */
export function alsoCalled(name: string, code: string): string | null {
  const s = SHORT[code];
  return s && s.toLowerCase() !== name.toLowerCase() ? s : null;
}

/** First candidate that fits in `max` characters, else the type-first fallback (intent stays visible). */
export function fitTitle(candidates: string[], fallback: string, max = 60): string {
  return candidates.find((t) => t.length <= max) ?? fallback;
}
