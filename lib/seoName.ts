/**
 * Shorter career names for <title> tags only (the H1 and page text keep the official O*NET name).
 * Only meaning-preserving rewrites of the long O*NET/SOC naming patterns; the audit checks that
 * no two pages end up with the same title.
 */
const RULES: [RegExp, string][] = [
  [/ Setters, Operators, and Tenders/g, " Operators"],
  [/ Operators and Tenders/g, " Operators"],
  [/Technologists and Technicians/g, "Technicians"],
  [/, Metal and Plastic$/, " (Metal and Plastic)"],
];

export function seoName(name: string): string {
  let s = name;
  for (const [a, b] of RULES) s = s.replace(a, b);
  return s;
}

/** First candidate that fits in `max` characters, else the type-first fallback (intent stays visible). */
export function fitTitle(candidates: string[], fallback: string, max = 60): string {
  return candidates.find((t) => t.length <= max) ?? fallback;
}
