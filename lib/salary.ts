/**
 * Salary pages: /careers/[slug]/salary (all states) and /careers/[slug]/salary/[state].
 * Numbers: BLS OEWS May 2025, national file (occupations.json) and state file (data/processed/wages).
 * Values BLS does not publish ("*" or "#" in the source) are null and shown as "Not published".
 */
import "server-only";
import type { Faq } from "@/components/page/Common";
import { statePay, type StatePay } from "@/lib/careerProfile";
import { displayName, occBySlug, occupations, transitionsFor, type Occupation } from "@/lib/data/server";
import { clip, inSentence, money, signedPct } from "@/lib/format";

export const stateSlug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");
/** State pages with fewer workers than this are noindex (estimates for very small groups are less reliable). */
// Launch setting (27 Oct 2026): only states with 5,000+ jobs are indexed; lower to 1,000 once Search Console
// shows these pages are indexed and get impressions. Small cells have high BLS sampling error.
export const STATE_INDEX_MIN_EMPLOYMENT = 5000;

const pctVs = (v: number | null, base: number | null) =>
  v == null || !base ? null : Math.round(((v - base) / base) * 100);

export interface StateRow extends StatePay {
  slug: string;
  rank: number;
  vsNational: number | null;
}

function base(slug: string) {
  const o = occBySlug(slug);
  if (!o || o.thin || !o.wage) return null;
  const states = statePay(slug);
  if (!states.length) return null;
  const nat = o.wage.median;
  const rows: StateRow[] = states.map((s, i) => ({ ...s, slug: stateSlug(s.state), rank: i + 1, vsNational: pctVs(s.median, nat) }));
  const name = displayName(o.title);
  return { o, name, nameLower: inSentence(name), rows, nat, group: o.wage.is_group };
}

export function salarySlugs(): string[] {
  return occupations()
    .filter((o) => !o.thin && o.wage && statePay(o.slug).length)
    .map((o) => o.slug);
}

const statesLabel = (rows: StateRow[]) =>
  rows.some((r) => r.abbr === "DC") ? `${rows.length - 1} states and DC` : `${rows.length} states`;

export function buildSalary(slug: string) {
  const b = base(slug);
  if (!b) return null;
  const { o, name, nameLower, rows, nat, group } = b;
  const hi = rows[0]!;
  const lo = rows[rows.length - 1]!;
  const title =
    [`${name} Salary by State (2025 BLS Data)`, `${name} Salary by State`, `${name} Pay by State`].find(
      (t) => t.length <= 60,
    ) ?? `${name} Pay by State`;
  const groupNote = group ? ` These figures are for the broader BLS group “${o.wage!.bls_title}”.` : "";
  const description = clip(
    `${name} earn a national median of ${money(nat)}. See median pay in all ${statesLabel(rows)} with data, from ${money(lo.median)} in ${lo.state} to ${money(hi.median)} in ${hi.state}. BLS May 2025.`,
    160,
  );
  const intro = `The national median pay for ${nameLower} is ${money(nat)} a year. By state, it ranges from ${money(lo.median)} in ${lo.state} to ${money(hi.median)} in ${hi.state}.${groupNote}`;
  const mostJobs = [...rows].filter((r) => r.employment != null).sort((a, b) => b.employment! - a.employment!)[0];
  const faq: Faq[] = [
    { q: `Which state pays ${nameLower} the most?`, a: `${hi.state}, with a median of ${money(hi.median)} a year (${signedPct(hi.vsNational)} vs. the national median of ${money(nat)}). BLS May 2025.` },
    { q: `Which state pays ${nameLower} the least?`, a: `${lo.state}, with a median of ${money(lo.median)} a year (${signedPct(lo.vsNational)} vs. national).` },
    ...(mostJobs
      ? [{ q: `Where do most ${nameLower} work?`, a: `${mostJobs.state} has the most jobs, about ${mostJobs.employment!.toLocaleString("en-US")}, with a median of ${money(mostJobs.median)}.` }]
      : []),
    { q: "Does a higher salary mean more money left over?", a: "Not always. These are pay figures only. Living costs, taxes and housing differ a lot between states, and this page does not adjust for them." },
  ];
  return { o, name, nameLower, rows, nat, group, title, description, intro, faq, statesLabel: statesLabel(rows), hi, lo, mostJobs };
}

export function buildStateSalary(slug: string, state: string) {
  const b = base(slug);
  if (!b) return null;
  const { o, name, nameLower, rows, nat, group } = b;
  const s = rows.find((r) => r.slug === state);
  if (!s) return null;
  const title =
    [`${name} Salary in ${s.state} (2025)`, `${name} Salary in ${s.state}`, `${name} Pay in ${s.state}`].find((t) => t.length <= 60) ??
    `${name} Pay in ${s.state}`;
  const description = clip(
    `${name} in ${s.state} earn a median of ${money(s.median)} a year, ${signedPct(s.vsNational)} vs. the U.S. median, ranking ${s.rank} of ${rows.length}. BLS May 2025 data.`,
    160,
  );
  // similar careers' pay in this state (from the "Jobs similar to" list)
  const tr = transitionsFor(slug);
  const similar = (tr?.similar ?? [])
    .slice(0, 8)
    .map((t) => {
      const ss = statePay(t.slug).find((x) => x.abbr === s.abbr);
      return ss ? { slug: t.slug, title: t.title, median: ss.median, group: t.wage_is_group } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 6);
  const neighbors = rows.filter((r) => Math.abs(r.rank - s.rank) <= 2 && r.slug !== s.slug);
  const noindex = s.employment == null || s.employment < STATE_INDEX_MIN_EMPLOYMENT;
  const faq: Faq[] = [
    { q: `How much do ${nameLower} make in ${s.state}?`, a: `The median is ${money(s.median)} a year. The lowest-paid 10% earn under ${money(s.p10)}${s.p90 != null ? ` and the top 10% earn over ${money(s.p90)}` : ""}. BLS OEWS May 2025.` },
    { q: `Is ${s.state} a good state for ${nameLower}?`, a: `On pay alone it ranks ${s.rank} of ${rows.length} (${signedPct(s.vsNational)} vs. the national median of ${money(nat)}). Living costs are not included.` },
  ];
  return { o, name, nameLower, s, rows, nat, group, title, description, similar, neighbors, noindex, faq, others: rows };
}

export type { Occupation };
