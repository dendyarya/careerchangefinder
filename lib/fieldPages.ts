/**
 * "Career change to [field]" pages: tech, healthcare, nursing, skilled trades. Field membership is a
 * fixed SOC code rule (FIELDS below, printed on each page). Pay and jobs: BLS OEWS May 2025.
 * Preparation: O*NET 31.0 Job Zones. Best starting points: our career-change match scores
 * (data/processed/transitions). Rules are recomputed by scripts/qa/check_pages_vs_data.py.
 */
import "server-only";
import type { Faq } from "@/components/page/Common";
import { ageData, isPromotionRole } from "@/lib/agePages";
import { careerChangeSources, occupations, transitionsFor, type Occupation } from "@/lib/data/server";
import { money } from "@/lib/format";

export const FIELD_SLUGS = ["to-tech", "to-healthcare", "to-nursing", "to-skilled-trades"] as const;
export type FieldSlug = (typeof FIELD_SLUGS)[number];

interface FieldConfig {
  name: string; // "tech"
  h1: string; // highlighted part of H1
  title: string;
  rule: string; // printed on the page
  match: (code: string) => boolean;
}

const NURSING = new Set(["31-1131", "29-2061", "29-1141", "29-1171", "29-1151", "29-1161", "25-1072"]);

export const FIELDS: Record<FieldSlug, FieldConfig> = {
  "to-tech": {
    name: "tech",
    h1: "tech",
    title: "Career Change to Tech: Paths, Pay and Training",
    rule: "Computer occupations (SOC 15-1200) and data scientists (SOC 15-2051)",
    match: (c) => c.startsWith("15-12") || c.startsWith("15-2051"),
  },
  "to-healthcare": {
    name: "healthcare",
    h1: "healthcare",
    title: "Career Change to Healthcare: Jobs, Pay and Training",
    rule: "Healthcare practitioners and technical occupations (SOC 29) and healthcare support (SOC 31)",
    match: (c) => c.startsWith("29-") || c.startsWith("31-"),
  },
  "to-nursing": {
    name: "nursing",
    h1: "nursing",
    title: "Career Change to Nursing: Every Path, Pay and Training",
    rule: "Nursing assistants, LPNs and LVNs, registered nurses and their specialties, nurse practitioners, nurse anesthetists, nurse midwives and nursing instructors",
    match: (c) => NURSING.has(c.slice(0, 7)),
  },
  "to-skilled-trades": {
    name: "skilled trades",
    h1: "skilled trades",
    title: "Career Change to Skilled Trades: Jobs, Pay and Training",
    rule: "Construction trades (SOC 47-2000 and 47-4000) and installation, maintenance and repair (SOC 49), without helpers",
    match: (c) => (c.startsWith("47-2") || c.startsWith("47-4") || c.startsWith("49-")) && !c.startsWith("47-3"),
  },
};

/** Official facts for nursing steps (BLS Occupational Outlook Handbook). */
export const NURSING_STEPS: { codes: string[]; text: string; source: { label: string; url: string } }[] = [
  {
    codes: ["31-1131"],
    text: "Complete a state-approved nursing assistant program with supervised clinical work. Many states require a competency exam and placement on the state registry.",
    source: { label: "BLS OOH: Nursing Assistants and Orderlies", url: "https://www.bls.gov/ooh/healthcare/nursing-assistants.htm" },
  },
  {
    codes: ["29-2061"],
    text: "Complete a state-approved practical nursing program, which typically takes about 1 year, then pass an exam to become licensed.",
    source: { label: "BLS OOH: Licensed Practical and Licensed Vocational Nurses", url: "https://www.bls.gov/ooh/healthcare/licensed-practical-and-licensed-vocational-nurses.htm" },
  },
  {
    codes: ["29-1141"],
    text: "Earn a bachelor's degree, an associate's degree or a diploma from an approved nursing program, pass a qualifying exam, and hold a nursing license from the state where you work.",
    source: { label: "BLS OOH: Registered Nurses", url: "https://www.bls.gov/ooh/healthcare/registered-nurses.htm" },
  },
  {
    codes: ["29-1171", "29-1151", "29-1161"],
    text: "Hold an RN license first, then earn at least a master's degree in the specialty. Most states also require national certification.",
    source: { label: "BLS OOH: Nurse Anesthetists, Nurse Midwives, and Nurse Practitioners", url: "https://www.bls.gov/ooh/healthcare/nurse-anesthetists-nurse-midwives-and-nurse-practitioners.htm" },
  },
];

export interface FieldRow {
  slug: string;
  title: string;
  median: number | null;
  group: boolean;
  jobZone: number | null;
  jobs: number | null;
  share45: number | null;
}

export interface StartRow {
  fromSlug: string;
  fromTitle: string;
  toSlug: string;
  toTitle: string;
  match: number;
  payChange: number | null;
}

const row = (o: Occupation): FieldRow => {
  const a = ageData().careers[o.code];
  return {
    slug: o.slug,
    title: o.title,
    median: o.wage?.median ?? null,
    group: Boolean(o.wage?.is_group),
    jobZone: o.job_zone,
    jobs: o.wage && !o.wage.is_group ? o.wage.employment : null,
    share45: a?.share_45_plus ?? null,
  };
};

export function buildFieldPage(slug: FieldSlug) {
  const f = FIELDS[slug];
  const members = occupations().filter((o) => !o.thin && f.match(o.code));
  const inField = new Set(members.map((o) => o.slug));
  const all = members.map(row).sort((a, b) => (b.jobs ?? 0) - (a.jobs ?? 0) || a.title.localeCompare(b.title));
  const entry = members
    .filter((o) => (o.job_zone ?? 9) <= 3 && !isPromotionRole(o))
    .map(row)
    .sort((a, b) => (b.group ? 0 : (b.median ?? 0)) - (a.group ? 0 : (a.median ?? 0)) || a.title.localeCompare(b.title));
  const jobsTotal = all.reduce((s, r) => s + (r.jobs ?? 0), 0);

  // best starting points: jobs outside the field whose career-change top list reaches into it
  const starts: StartRow[] = [];
  const bySlug = new Map(occupations().map((o) => [o.slug, o]));
  for (const s of careerChangeSources()) {
    const src = bySlug.get(s);
    if (!src || inField.has(s) || f.match(src.code)) continue;
    const tr = transitionsFor(s);
    const best = tr?.top.find((t) => inField.has(t.slug));
    if (best) starts.push({ fromSlug: s, fromTitle: src.title, toSlug: best.slug, toTitle: best.title, match: best.match, payChange: best.wage_is_group ? null : best.pay_change_pct });
  }
  starts.sort((a, b) => b.match - a.match || a.fromTitle.localeCompare(b.fromTitle));
  const startTop = starts.slice(0, 20);

  const nursingSteps =
    slug === "to-nursing"
      ? NURSING_STEPS.map((s) => ({
          ...s,
          rows: members.filter((o) => s.codes.includes(o.code.slice(0, 7)) && o.code.endsWith(".00")).map(row),
        }))
      : [];

  const intro = `${all.length} ${f.name} careers employ ${jobsTotal.toLocaleString("en-US")} people in the U.S. (BLS, May 2025). ${entry.length} of them usually take two years or less to prepare for. Below: the ways in, every ${f.name} career with pay and jobs, and the jobs whose skills carry over best.`;
  const topEntry = entry.filter((r) => !r.group).slice(0, 3).map((r) => `${r.title} (${money(r.median)})`).join(", ");
  const faq: Faq[] = [
    {
      q: `Can I switch to ${f.name} without a degree?`,
      a: `Often, yes. ${entry.length} ${f.name} careers usually need two years or less of preparation. The best-paid are ${topEntry}.`,
    },
    {
      q: `Which jobs make it easiest to move into ${f.name}?`,
      a: `By our skill match, people coming from ${startTop.slice(0, 3).map((s) => s.fromTitle).join(", ")} have the closest ${f.name} matches. Use the Career Change Tool to check your own job.`,
    },
    {
      q: `How many ${f.name} jobs are there?`,
      a: `About ${jobsTotal.toLocaleString("en-US")} across the ${all.length} careers on this page with their own BLS estimate (BLS OEWS, May 2025).`,
    },
    {
      q: "Which careers count as this field?",
      a: `${f.rule}. Data: BLS OEWS May 2025 pay and jobs, O*NET 31.0 preparation, BLS CPS 2025 worker ages.`,
    },
  ];
  return { slug, ...f, all, entry, startTop, nursingSteps, jobsTotal, intro, faq, description: `${all.length} ${f.name} careers with pay, jobs and training time, the fastest ways in, and the jobs whose skills carry over best. BLS 2025 data.` };
}
