/**
 * Salary pages: /careers/[slug]/salary, one page per career with every state (state URLs redirect to its rows).
 * Numbers: BLS OEWS May 2025, national file (occupations.json) and state file (data/processed/wages).
 * Values BLS does not publish ("*" or "#" in the source) are null and shown as "Not published".
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { statePay, type StatePay } from "@/lib/careerProfile";
import { displayName, occBySlug, occupations, type Occupation } from "@/lib/data/server";
import { clip, inSentence, money, per1000, signedPct } from "@/lib/format";
import { fitTitle, seoName } from "@/lib/seoName";
import { isPublished } from "@/lib/published";

export const stateSlug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");
export interface StateTotal {
  state: string;
  employment: number;
  median: number;
  hourly_median: number | null;
}
let totals: Record<string, StateTotal> | null = null;
/** All occupations in each state (BLS OEWS May 2025, OCC_CODE 00-0000). */
export function stateTotals(): Record<string, StateTotal> {
  totals ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "processed", "state_totals.json"), "utf8")) as Record<string, StateTotal>;
  return totals;
}

const pctVs = (v: number | null, base: number | null) =>
  v == null || !base ? null : Math.round(((v - base) / base) * 100);

export interface StateRow extends StatePay {
  slug: string;
  rank: number;
  vsNational: number | null;
  /** vs. the median for all jobs in the same state */
  vsLocal: number | null;
}

function base(slug: string) {
  const o = occBySlug(slug);
  if (!o || o.thin || !o.wage) return null;
  const states = statePay(slug);
  if (!states.length) return null;
  const nat = o.wage.median;
  const t = stateTotals();
  const rows: StateRow[] = states.map((s, i) => ({
    ...s,
    slug: stateSlug(s.state),
    rank: i + 1,
    vsNational: pctVs(s.median, nat),
    vsLocal: pctVs(s.median, t[s.abbr]?.median ?? null),
  }));
  const name = displayName(o.title);
  return { o, name, nameLower: inSentence(name), rows, nat, group: o.wage.is_group };
}

export function salarySlugs(): string[] {
  return occupations()
    .filter((o) => !o.thin && o.wage && statePay(o.slug).length && isPublished("salary", o.slug))
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
  const sn = seoName(name, o.code);
  const title = fitTitle(
    [`${name} Salary by State (2025 BLS Data)`, `${name} Salary by State`, `${name} Pay by State`, `${sn} Salary by State`, `${sn} Pay by State`],
    `Salary by State: ${sn}`,
  );
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
  // where the job is most common (jobs per 1,000 jobs in the state)
  const concentrated = rows
    .filter((r) => r.jobs_per_1000 != null)
    .sort((a, b) => b.jobs_per_1000! - a.jobs_per_1000!)
    .slice(0, 8);
  // where it pays most compared with all jobs in the same state
  const t = stateTotals();
  const vsLocal = rows
    .map((r) => ({ ...r, local: t[r.abbr]?.median ?? null }))
    .filter((r): r is typeof r & { local: number } => r.local != null)
    .map((r) => ({ ...r, ratio: r.median / r.local }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 8);
  if (concentrated[0]) {
    faq.splice(faq.length - 1, 0, {
      q: `Where are ${nameLower} jobs most common?`,
      a: `${concentrated[0].state}, with ${per1000(concentrated[0].jobs_per_1000!)} of every 1,000 jobs${concentrated[0].lq != null ? ` (${concentrated[0].lq.toFixed(2)} times the U.S. share)` : ""}. Most common does not always mean best paid: compare both lists on this page.`,
    });
  }
  return { o, name, nameLower, rows, nat, group, title, description, intro, faq, statesLabel: statesLabel(rows), hi, lo, mostJobs, concentrated, vsLocal };
}

export type { Occupation };
