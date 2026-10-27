/**
 * "Career change to [career]" pages for keywords verified in Ahrefs (27 Oct 2026). Each page is built
 * from data already on the site: the reverse career-change index ("into": jobs whose best matches include
 * this career), O*NET 31.0 education and Job Zones, BLS OEWS May 2025 pay, BLS CPS 2025 ages, and
 * licensing facts quoted from the BLS Occupational Outlook Handbook. Member careers are chosen from
 * O*NET's own titles (for example every occupation that O*NET lists "Data Analyst" as a job title for).
 */
import "server-only";
import type { Faq } from "@/components/page/Common";
import { ageData, CAREER_NOTES, JZ_PREP } from "@/lib/agePages";
import { statePay } from "@/lib/careerProfile";
import { displayName, occByCode, occBySlug, transitionsFor, type Occupation } from "@/lib/data/server";
import { listJoin, money } from "@/lib/format";

type Source = { label: string; url: string };
interface TargetConfig {
  h1: string; // "data scientist"
  title: string;
  codes: string[];
  why?: string; // how the member careers were chosen
  notes?: { text: string; source: Source }[];
}

const OOH = (path: string, label: string): Source => ({ label: `BLS Occupational Outlook Handbook: ${label}`, url: `https://www.bls.gov/ooh/${path}` });

export const TARGETS: Record<string, TargetConfig> = {
  "to-data-scientist": {
    h1: "data scientist",
    title: "Career Change to Data Scientist: Skills, Pay and Paths",
    codes: ["15-2051.00"],
  },
  "to-data-analyst": {
    h1: "data analyst",
    title: "Career Change to Data Analyst: Skills, Pay and Paths",
    codes: ["15-2051.01", "15-2051.00", "15-2041.00", "13-2099.01", "19-3022.00", "15-1243.00", "19-1029.01", "19-4061.00"],
    why: "O*NET has no occupation called “data analyst”. It lists “Data Analyst” as a job title in these occupations, so this page covers all of them.",
  },
  "to-web-developer": {
    h1: "web developer",
    title: "Career Change to Web Developer: Skills, Pay and Paths",
    codes: ["15-1254.00"],
  },
  "to-ux-design": {
    h1: "UX design",
    title: "Career Change to UX Design: Skills, Pay and Paths",
    codes: ["15-1255.00"],
    why: "O*NET files UX and user experience designer job titles mainly under Web and Digital Interface Designers.",
  },
  "to-project-management": {
    h1: "project management",
    title: "Career Change to Project Management: Pay and Paths",
    codes: ["13-1082.00", "15-1299.09"],
    why: "O*NET uses “Project Manager” as a job title most often in these two occupations.",
  },
  "to-accounting": {
    h1: "accounting",
    title: "Career Change to Accounting: CPA Rules, Pay and Paths",
    codes: ["13-2011.00"],
    notes: [
      {
        text: "Accountants and auditors typically need at least a bachelor's degree in accounting or a related field. Accountants who file reports with the Securities and Exchange Commission must be licensed CPAs. All states require CPA candidates to complete 150 semester hours of college coursework, and becoming a CPA requires passing a national exam and meeting other state requirements.",
        source: OOH("business-and-financial/accountants-and-auditors.htm", "Accountants and Auditors"),
      },
    ],
  },
  "to-financial-advisor": {
    h1: "financial advisor",
    title: "Career Change to Financial Advisor: Pay and Paths",
    codes: ["13-2052.00"],
    notes: [
      {
        text: "Personal financial advisors typically need a bachelor's degree. They may need a combination of licenses that varies with the products they sell, and advisors who manage investments must be registered with state regulators or, at large firms, with the SEC. Certifications are optional but can help bring in clients.",
        source: OOH("business-and-financial/personal-financial-advisors.htm", "Personal Financial Advisors"),
      },
    ],
  },
  "to-teaching": {
    h1: "teaching",
    title: "Career Change to Teaching: Licenses, Pay and Paths",
    codes: ["25-2021.00", "25-2011.00", "25-2012.00", "25-2022.00", "25-2031.00", "25-2023.00", "25-2032.00", "25-2051.00", "25-2055.00", "25-2056.00", "25-2057.00", "25-2058.00"],
    why: "Preschool to high school teachers, including special education and career and technical education.",
    notes: [
      {
        text: "Kindergarten and elementary school teachers usually must have a bachelor's degree. All states require teachers in public schools to be licensed or certified for the grade level they teach. People with a bachelor's degree in another subject can still become teachers: all states offer an alternative route to certification for people who already have a bachelor's degree.",
        source: OOH("education-training-and-library/kindergarten-and-elementary-school-teachers.htm", "Kindergarten and Elementary School Teachers"),
      },
    ],
  },
  "to-pilot": {
    h1: "pilot",
    title: "Career Change to Pilot: Airline and Commercial Paths",
    codes: ["53-2011.00", "53-2012.00"],
    notes: [{ text: CAREER_NOTES["53-2012.00"]!.text, source: CAREER_NOTES["53-2012.00"]!.sources[0]! }],
  },
  "to-doctor": {
    h1: "doctor",
    title: "Career Change to Doctor: Training Years and Alternatives",
    codes: [
      "29-1215.00", "29-1211.00", "29-1213.00", "29-1214.00", "29-1216.00", "29-1217.00", "29-1218.00", "29-1221.00",
      "29-1222.00", "29-1223.00", "29-1224.00", "29-1241.00",
    ],
    why: "Physicians and surgeons in O*NET 31.0 with full data.",
    notes: [
      {
        text: "Physicians and surgeons typically need a bachelor's degree and a degree from a medical school, which takes an additional 4 years, followed by a residency that typically lasts from 3 to 9 years depending on the specialty. All states require physicians and surgeons to be licensed; licensure includes passing standardized national exams.",
        source: OOH("healthcare/physicians-and-surgeons.htm", "Physicians and Surgeons"),
      },
    ],
  },
};
export const TARGET_SLUGS = Object.keys(TARGETS);

const LICENSED = ["29-1011", "29-1021", "29-1022", "29-1023", "29-1024", "29-1029", "29-1041", "29-1051", "29-1071", "29-1081", "29-1131", "29-1161", "29-1171", "29-12", "23-1011", "23-1012", "23-1021", "23-1022", "23-1023", "19-3033", "19-3034", "19-3039"];

export interface MemberRow {
  slug: string;
  title: string;
  median: number | null;
  group: boolean;
  jobs: number | null;
  jobZone: number | null;
  share45: number | null;
}
export interface FromRow {
  slug: string;
  title: string;
  median: number | null;
  group: boolean;
  match: number;
  to: { slug: string; title: string };
  gaps: string[];
}

const member = (o: Occupation): MemberRow => ({
  slug: o.slug,
  title: o.title,
  median: o.wage?.median ?? null,
  group: Boolean(o.wage?.is_group),
  jobs: o.wage && !o.wage.is_group ? o.wage.employment : null,
  jobZone: o.job_zone,
  share45: ageData().careers[o.code]?.share_45_plus ?? null,
});

export function buildTarget(slug: string) {
  const c = TARGETS[slug];
  if (!c) return null;
  const occs = c.codes.map((code) => occByCode(code)).filter((o): o is Occupation => Boolean(o && !o.thin));
  if (!occs.length) return null;
  // pay, education and age figures come from the first member with its own BLS wage
  const primary = occs.find((o) => o.wage && !o.wage.is_group) ?? occs[0]!;
  const memberSlugs = new Set(occs.map((o) => o.slug));
  const members = occs.map(member).sort((a, b) => (b.jobs ?? 0) - (a.jobs ?? 0) || a.title.localeCompare(b.title));

  // best jobs to switch from: union of the reverse index, best match per source job
  const best = new Map<string, FromRow>();
  for (const o of occs) {
    for (const x of transitionsFor(o.slug)?.into ?? []) {
      if (memberSlugs.has(x.slug)) continue;
      const cur = best.get(x.slug);
      if (cur && cur.match >= x.match) continue;
      const item = transitionsFor(x.slug)?.top.find((t) => t.slug === o.slug);
      best.set(x.slug, {
        slug: x.slug,
        title: x.title,
        median: x.median,
        group: Boolean(occBySlug(x.slug)?.wage?.is_group),
        match: x.match,
        to: { slug: o.slug, title: o.title },
        gaps: item?.skill_gaps ?? [],
      });
    }
  }
  const from = [...best.values()].sort((a, b) => b.match - a.match || a.title.localeCompare(b.title)).slice(0, 15);

  // careers like it with a shorter or different path (pure similarity; no long licensed professions)
  const alternatives = (transitionsFor(primary.slug)?.similar ?? [])
    .filter((s) => !memberSlugs.has(s.slug) && !LICENSED.some((p) => s.code.startsWith(p)))
    .slice(0, 6);

  const age = ageData().careers[primary.code];
  const states = primary.wage ? statePay(primary.slug).slice(0, 3) : [];
  const edu = [...primary.education_dist]
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((e) => ({ ...e, label: String(e.label).split(" - ")[0]! }));
  const name = displayName(primary.title);
  const many = occs.length > 1;
  const below = from.length
    ? "Below: the jobs whose skills carry over best, what you need to get in, and pay."
    : "Below: what you need to get in, pay, and similar careers with a different path.";
  const pay = primary.wage?.median;
  const intro = many
    ? `${c.why ?? ""} Together they employ ${members.reduce((s, r) => s + (r.jobs ?? 0), 0).toLocaleString("en-US")} people (BLS, May 2025). ${below}`
    : `${name} earn a median of ${money(pay)} a year (BLS, May 2025)${primary.wage?.is_group ? " (broader BLS group)" : ""}${c.why ? `. ${c.why}` : ""}. ${below}`;
  const faq: Faq[] = [];
  if (from.length)
    faq.push({
      q: `What jobs make it easiest to switch to ${c.h1}?`,
      a: `By our skill match, people working as ${listJoin(from.slice(0, 3).map((f) => `${f.title} (${f.match}%)`))} have the most transferable experience.`,
    });
  faq.push({
    q: `What education do you need for ${c.h1}?`,
    a: edu.length
      ? `${name}: ${edu.map((e) => `${Math.round(e.pct)}% of workers report ${String(e.label).toLowerCase()} as required`).join("; ")} (O*NET 31.0). Usual preparation: ${JZ_PREP[primary.job_zone ?? 0] ?? "varies"}.`
      : `Usual preparation for ${name.toLowerCase()}: ${(JZ_PREP[primary.job_zone ?? 0] ?? "varies").toLowerCase()} (O*NET 31.0 Job Zone).`,
  });
  if (age?.share_45_plus != null)
    faq.push({
      q: `Is it too late to switch to ${c.h1} at 40?`,
      a: `${Math.round(age.share_45_plus * 100)}% of ${name.toLowerCase()} are 45 or older${age.median_age != null ? ` and their median age is ${age.median_age}` : ""} (BLS Current Population Survey, 2025${age.group ? ", broader occupation group" : ""}).`,
    });
  if (pay)
    faq.push({
      q: `How much do ${name.toLowerCase()} make?`,
      a: `The national median is ${money(pay)} a year (BLS OEWS May 2025)${states.length ? `. Highest-paying states: ${states.map((s) => `${s.state} (${money(s.median)})`).join(", ")}` : ""}.`,
    });
  const heading = c.h1.replace(/\b([a-z])/g, (x) => x.toUpperCase()); // "Data Analyst", "UX Design"
  return {
    slug,
    ...c,
    heading,
    primary,
    name,
    members,
    from,
    alternatives,
    age,
    states,
    edu,
    intro,
    faq,
    description: `How to switch to ${c.h1}: the jobs whose skills carry over best, education and licenses, pay and worker ages. O*NET 31.0 and BLS 2025 data.`,
    memberOcc: occs,
  };
}

