/**
 * Salary pages: /careers/[slug]/salary (all states) and /careers/[slug]/salary/[state].
 * Numbers: BLS OEWS May 2025, national file (occupations.json) and state file (data/processed/wages).
 * Values BLS does not publish ("*" or "#" in the source) are null and shown as "Not published".
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { statePay, type StatePay } from "@/lib/careerProfile";
import { displayName, occBySlug, occupations, transitionsFor, type Occupation } from "@/lib/data/server";
import { clip, inSentence, money, per1000, signedPct } from "@/lib/format";
import { fitTitle, seoName } from "@/lib/seoName";
import { isPublished } from "@/lib/published";
import { STATE_NEIGHBORS } from "@/lib/stateNeighbors";

export const stateSlug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");
/** State pages with fewer workers than this are noindex (estimates for very small groups are less reliable). */
// Launch setting (27 Oct 2026): only states with 5,000+ jobs are indexed; lower to 1,000 once Search Console
// shows these pages are indexed and get impressions. Small cells have high BLS sampling error.
export const STATE_INDEX_MIN_EMPLOYMENT = 5000;
/** BLS relative standard error (%) above which a state job count is treated as unreliable (noindex). */
export const STATE_INDEX_MAX_RSE = 25;

/** One rule for the page's robots tag and the sitemap: enough jobs and a reliable BLS estimate. */
export function stateIndexable(st: Pick<StatePay, "employment" | "emp_rse">): boolean {
  return st.employment != null && st.employment >= STATE_INDEX_MIN_EMPLOYMENT && (st.emp_rse == null || st.emp_rse <= STATE_INDEX_MAX_RSE);
}

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

/** "Better-paying close careers" rule, the same as the research study: top 25 matches, own BLS pay on both
 * sides in the same state, Job Zone not higher, no manager (SOC 11) or supervisor role, >= 10% more. */
export function betterPayingInState(slug: string, abbr: string, base: number) {
  const tr = transitionsFor(slug);
  if (!tr) return [];
  const out: { slug: string; title: string; match: number; median: number; raise: number }[] = [];
  for (const t of tr.top.slice(0, 25)) {
    if (t.wage_is_group || t.code.startsWith("11-") || /supervisor/i.test(t.title)) continue;
    if (t.job_zone && tr.job_zone && t.job_zone > tr.job_zone) continue;
    const to = occBySlug(t.slug);
    if (!to || to.thin || !to.wage || !isPublished("salary", t.slug)) continue; // its salary pages must exist
    const p = statePay(t.slug).find((x) => x.abbr === abbr);
    if (p && !isPublished("salary-states", `${t.slug}/${stateSlug(p.state)}`)) continue;
    if (!p || p.median * 100 < base * 110) continue;
    out.push({ slug: t.slug, title: t.title, match: t.match, median: p.median, raise: Math.round(((p.median - base) / base) * 100) });
  }
  return out;
}

const np = (n: number | null) => (n == null ? "an unpublished amount" : money(n));
const dollars = (n: number) => `$${n.toFixed(2)}`;

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

export function buildStateSalary(slug: string, state: string) {
  const b = base(slug);
  if (!b) return null;
  const { o, name, nameLower, rows, nat, group } = b;
  const s = rows.find((r) => r.slug === state);
  if (!s || !isPublished("salary-states", `${slug}/${state}`)) return null;
  const sn = seoName(name, o.code);
  const title = fitTitle(
    [`${name} Salary in ${s.state} (2025)`, `${name} Salary in ${s.state}`, `${name} Pay in ${s.state}`, `${sn} Salary in ${s.state}`, `${sn} Pay in ${s.state}`],
    `${s.state} Salary: ${sn}`,
  );
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
  const noindex = !stateIndexable(s);

  // pay vs. all jobs in the same state
  const total = stateTotals()[s.abbr] ?? null;
  const vsStateAll = total ? pctVs(s.median, total.median) : null;
  // how common the job is here: jobs per 1,000 and its rank among states with that figure
  const byConc = rows.filter((r) => r.jobs_per_1000 != null).sort((a, b) => b.jobs_per_1000! - a.jobs_per_1000!);
  const concRank = s.jobs_per_1000 != null ? byConc.findIndex((r) => r.abbr === s.abbr) + 1 : null;
  const lq = s.lq;
  const concWord = lq == null ? null : lq >= 1.2 ? "more common here than" : lq <= 0.8 ? "less common here than" : "about as common here as";
  // bordering states with data, highest median first
  const borderAbbrs = STATE_NEIGHBORS[s.abbr] ?? [];
  const borders = rows.filter((r) => borderAbbrs.includes(r.abbr)).sort((a, b) => b.median - a.median);
  const higherBorders = borders.filter((r) => r.median > s.median);
  // better-paying close careers in this state (only when this job has its own BLS pay figure)
  const better = group ? [] : betterPayingInState(slug, s.abbr, s.median).slice(0, 6);

  const summary = [
    vsStateAll != null && total
      ? `That is ${vsStateAll >= 0 ? `${vsStateAll}% more` : `${Math.abs(vsStateAll)}% less`} than the median for all jobs in ${s.state} (${money(total.median)}).`
      : "",
    borders.length
      ? higherBorders.length
        ? `${higherBorders.length === 1 ? "One neighboring state pays" : `${higherBorders.length} of ${borders.length} neighboring states pay`} more, led by ${higherBorders[0]!.state} (${money(higherBorders[0]!.median)}).`
        : `It pays more than every neighboring state with data (${borders.map((r) => r.state).join(", ")}).`
      : "",
    concWord && s.jobs_per_1000 != null
      ? `The job is ${concWord} in the U.S. overall: ${per1000(s.jobs_per_1000)} of every 1,000 jobs in the state.`
      : "",
  ].filter(Boolean);

  const faq: Faq[] = [
    { q: `How much do ${nameLower} make in ${s.state}?`, a: `The median is ${money(s.median)} a year${s.hourly_median != null ? ` (${dollars(s.hourly_median)} an hour)` : ""}. The lowest-paid 10% earn under ${np(s.p10)}${s.p90 != null ? ` and the top 10% earn over ${money(s.p90)}` : ""}. BLS OEWS May 2025.` },
    { q: `Is ${s.state} a good state for ${nameLower}?`, a: `On pay alone it ranks ${s.rank} of ${rows.length} (${signedPct(s.vsNational)} vs. the national median of ${money(nat)}).${vsStateAll != null ? ` Compared with other work in ${s.state}, it pays ${signedPct(vsStateAll)} vs. the median for all jobs.` : ""} Living costs are not included.` },
    ...(concRank && s.jobs_per_1000 != null
      ? [{ q: `How common are jobs for ${nameLower} in ${s.state}?`, a: `There are about ${s.employment != null ? s.employment.toLocaleString("en-US") : "an unpublished number of"} jobs, or ${per1000(s.jobs_per_1000)} per 1,000 jobs in the state. That ranks ${concRank} of ${byConc.length} states by how common the job is${lq != null ? ` (location quotient ${lq.toFixed(2)}; 1.00 is the U.S. average)` : ""}.` }]
      : []),
  ];
  return {
    o, name, nameLower, s, rows, nat, group, title, description, similar, neighbors, noindex, faq, others: rows,
    total, vsStateAll, concRank, concCount: byConc.length, concWord, borders, better, summary,
  };
}

export type { Occupation };
