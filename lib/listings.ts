/**
 * "Careers by …" listing definitions (/careers/industry|education|personality|holland-code|salary/[x]).
 * Every list is a filter + sort over data/processed and data/tests; the rules are shown on each page.
 */
import "server-only";
import { careerAttrs } from "@/lib/careerProfile";
import { occupations, type Occupation } from "@/lib/data/server";
import { RIASEC_NAMES, SOC_GROUPS } from "@/lib/soc";

export interface ListRow {
  slug: string;
  title: string;
  median: number | null;
  group: boolean;
  jobZone: number | null;
  education: string | null;
  employment: number | null;
  extra?: string;
}

export interface Listing {
  kind: "industry" | "education" | "personality" | "holland-code" | "salary";
  slug: string;
  h1: string;
  title: string;
  intro: string;
  rule: string;
  rows: ListRow[];
}

const good = () => occupations().filter((o) => !o.thin);
const pay = (o: Occupation) => (o.wage && !o.wage.is_group ? (o.wage.median ?? 0) : 0);

function row(o: Occupation, extra?: string): ListRow {
  return {
    slug: o.slug,
    title: o.title,
    median: o.wage?.median ?? null,
    group: Boolean(o.wage?.is_group),
    jobZone: o.job_zone,
    education: o.first_step.typical_education?.label ?? null,
    employment: o.wage && !o.wage.is_group ? o.wage.employment : null,
    extra,
  };
}

const EDU: Record<string, { h1: string; cats: number[]; label: string }> = {
  "no-degree": { h1: "Jobs Without a Degree", cats: [1, 2], label: "high school diploma or less" },
  certificate: { h1: "Jobs With a Certificate or Associate Degree", cats: [3, 4, 5], label: "a certificate, some college or an associate degree" },
  bachelors: { h1: "Jobs With a Bachelor’s Degree", cats: [6, 7], label: "a bachelor’s degree (or a post-bachelor’s certificate)" },
  masters: { h1: "Jobs With a Master’s Degree", cats: [8], label: "a master’s degree" },
};

type Pers = { h1: string; attr: string; dir: "high" | "low"; why: string; minJz?: number };
const PERSONALITY: Record<string, Pers> = {
  introverts: { h1: "Jobs for Introverts", attr: "contact", dir: "low", why: "least contact with other people", minJz: 3 },
  extroverts: { h1: "Jobs for Extroverts", attr: "contact", dir: "high", why: "most contact with other people" },
  "detail-oriented": { h1: "Jobs for Detail-Oriented People", attr: "conscientiousness", dir: "high", why: "highest importance of attention to detail and dependability (O*NET Work Styles)" },
  "hate-routine": { h1: "Jobs for People Who Hate Routine", attr: "repetition", dir: "low", why: "least repetition of the same tasks", minJz: 3 },
  competitive: { h1: "Jobs for Competitive People", attr: "competition", dir: "high", why: "highest level of competition" },
  "low-stress": { h1: "Low-Stress Jobs", attr: "time_pressure", dir: "low", why: "least time pressure", minJz: 3 },
  "high-pressure": { h1: "High-Pressure Jobs", attr: "time_pressure", dir: "high", why: "most time pressure" },
};
const RIASEC_PERS: Record<string, { h1: string; letter: string; why: string }> = {
  creative: { h1: "Creative Jobs", letter: "A", why: "highest Artistic interest score" },
  "hands-on": { h1: "Hands-On Jobs", letter: "R", why: "highest Realistic interest score" },
  "helping-people": { h1: "Jobs Helping People", letter: "S", why: "highest Social interest score" },
};

export const LISTING_SLUGS: Record<Listing["kind"], string[]> = {
  industry: SOC_GROUPS.map((g) => g.slug),
  education: Object.keys(EDU),
  personality: [...Object.keys(PERSONALITY), ...Object.keys(RIASEC_PERS)],
  "holland-code": Object.values(RIASEC_NAMES).map((n) => n.toLowerCase()),
  salary: ["high-paying", "high-paying-no-degree"],
};

const N = 50;

export function buildListing(kind: Listing["kind"], slug: string): Listing | null {
  if (kind === "industry") {
    const g = SOC_GROUPS.find((x) => x.slug === slug);
    if (!g) return null;
    const rows = good()
      .filter((o) => o.code.startsWith(g.code))
      .sort((a, b) => (b.wage?.employment ?? 0) - (a.wage?.employment ?? 0) || a.title.localeCompare(b.title))
      .map((o) => row(o));
    return {
      kind,
      slug,
      h1: `${g.short} Careers`,
      title: `${g.short} Careers: Pay, Education and Skills`,
      intro: `${rows.length} careers in ${g.name} (SOC group ${g.code}), with BLS median pay and the education most workers have.`,
      rule: "All careers in this BLS occupation group that have full data, most common jobs first (BLS employment).",
      rows,
    };
  }
  if (kind === "education") {
    const e = EDU[slug];
    if (!e) return null;
    const rows = good()
      .filter((o) => e.cats.includes(o.first_step.typical_education?.category ?? -1))
      .sort((a, b) => pay(b) - pay(a))
      .map((o) => row(o));
    return {
      kind,
      slug,
      h1: e.h1,
      title: `${e.h1}: ${rows.length} Careers by Pay`,
      intro: `${rows.length} careers where the most common education among workers is ${e.label}, ranked by BLS median pay.`,
      rule: "Most common required education reported by workers to O*NET (Education, Training and Experience). Careers with only a broader BLS group wage are listed last.",
      rows,
    };
  }
  if (kind === "personality") {
    const p = PERSONALITY[slug];
    if (p) {
      const pool = good().filter((o) => careerAttrs(o.code)?.[p.attr] != null && (!p.minJz || (o.job_zone ?? 0) >= p.minJz));
      const rows = pool
        .sort((a, b) => {
          const va = careerAttrs(a.code)![p.attr]!;
          const vb = careerAttrs(b.code)![p.attr]!;
          return (p.dir === "high" ? vb - va : va - vb) || pay(b) - pay(a);
        })
        .slice(0, N)
        .map((o) => row(o));
      return {
        kind,
        slug,
        h1: p.h1,
        title: `${p.h1}: ${rows.length} Careers With Pay`,
        intro: `${rows.length} careers with the ${p.why} in O*NET 31.0 data${p.minJz ? ", among careers that usually need training or a degree" : ""}.`,
        rule: `Ranked by the ${p.why} compared with all U.S. careers (O*NET 31.0${p.attr === "conscientiousness" ? " Work Styles" : " Work Context"}).${p.minJz ? " Only careers at O*NET Job Zone 3 or higher." : ""}`,
        rows,
      };
    }
    const r = RIASEC_PERS[slug];
    if (!r) return null;
    const rows = good()
      .filter((o) => o.riasec)
      .sort((a, b) => (b.riasec![r.letter] ?? 0) - (a.riasec![r.letter] ?? 0) || pay(b) - pay(a))
      .slice(0, N)
      .map((o) => row(o, `${RIASEC_NAMES[r.letter]} ${o.riasec![r.letter]!.toFixed(2)}`));
    return {
      kind,
      slug,
      h1: r.h1,
      title: `${r.h1}: ${rows.length} Careers With Pay`,
      intro: `${rows.length} careers with the ${r.why} in O*NET 31.0 (scale 1–7).`,
      rule: `Ranked by the O*NET ${RIASEC_NAMES[r.letter]} interest score (1–7).`,
      rows,
    };
  }
  if (kind === "holland-code") {
    const letter = Object.entries(RIASEC_NAMES).find(([, n]) => n.toLowerCase() === slug)?.[0];
    if (!letter) return null;
    const name = RIASEC_NAMES[letter]!;
    const rows = good()
      .filter((o) => o.holland?.[0] === letter)
      .sort((a, b) => (b.riasec![letter] ?? 0) - (a.riasec![letter] ?? 0))
      .map((o) => row(o, o.holland ?? ""));
    return {
      kind,
      slug,
      h1: `${name} Careers (Holland Code ${letter})`,
      title: `${name} Careers: Holland Code ${letter} Jobs`,
      intro: `${rows.length} careers whose strongest O*NET interest area is ${name}.`,
      rule: `Careers whose highest O*NET interest score is ${name}, ranked by that score. The column shows each career’s 3-letter Holland code.`,
      rows,
    };
  }
  if (kind === "salary") {
    const noDeg = slug === "high-paying-no-degree";
    if (!noDeg && slug !== "high-paying") return null;
    const rows = good()
      .filter((o) => pay(o) > 0 && (!noDeg || [1, 2].includes(o.first_step.typical_education?.category ?? -1)))
      .sort((a, b) => pay(b) - pay(a))
      .slice(0, N)
      .map((o) => row(o));
    const h1 = noDeg ? "High-Paying Jobs Without a Degree" : "Highest-Paying Jobs";
    return {
      kind,
      slug,
      h1,
      title: `${h1}: Top ${rows.length} by BLS Median Pay`,
      intro: `The ${rows.length} highest median salaries in BLS May 2025 data${noDeg ? " among careers where most workers have a high school diploma or less" : ""}.`,
      rule: "Ranked by BLS OEWS May 2025 national median pay. Careers that only have a broader group wage are left out.",
      rows,
    };
  }
  return null;
}
