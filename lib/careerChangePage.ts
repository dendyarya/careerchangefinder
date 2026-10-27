/**
 * Builds the "Jobs for Former [job]" page model from data/processed. Every number on the page comes
 * from here, so the page component only lays it out. Unit-tested in careerChangePage.test.ts.
 */
import "server-only";
import {
  displayName,
  hubData,
  occBySlug,
  occByCode,
  transitionsFor,
  type Occupation,
  type TransitionItem,
} from "@/lib/data/server";
import { clip, inSentence, listJoin, money, signedPct } from "@/lib/format";
import { fitTitle, seoName } from "@/lib/seoName";
import type { Faq } from "@/components/page/Common";
import type { Row } from "@/components/career-change/CareerTable";

export const EXTRA_EDU: Record<number, string> = {
  1: "None",
  2: "High school diploma",
  3: "Certificate or associate",
  4: "Bachelor's degree",
  5: "Graduate degree",
};

export interface UpClose {
  slug: string;
  title: string;
  match: number;
  median: number | null;
  payChange: number | null;
  groupWage: string | null;
  firstStep: string[];
  skillsToLearn: string[];
  hardParts: string[];
}

export interface FromPageModel {
  slug: string;
  isHub: boolean;
  /** "Teachers", "Registered Nurses" */
  name: string;
  /** "teacher", "registered nurse" (for sentences) */
  singularLower: string;
  pluralLower: string;
  sourceLabel: string;
  baseline: number | null;
  members: { title: string; slug: string }[];
  intro: string;
  sourceSkills: { name: string; value: number }[];
  rows: Row[];
  skillsToLearn: string[];
  upClose: UpClose[];
  similarInField: { slug: string; title: string; match: number }[];
  faq: Faq[];
  title: string;
  description: string;
}

function singularize(plural: string) {
  if (/people$/i.test(plural)) return plural.replace(/people$/i, "person");
  if (/ies$/i.test(plural)) return plural.replace(/ies$/i, "y");
  if (/(ches|shes|sses|xes)$/i.test(plural)) return plural.replace(/es$/i, "");
  return plural.replace(/s$/i, "");
}

function firstStepLines(o: Occupation | undefined, sourceZone: number | null): string[] {
  if (!o) return [];
  const fs = o.first_step;
  const out: string[] = [];
  if (fs.typical_education?.label)
    out.push(
      `Most common education: ${fs.typical_education.label} (${Math.round(fs.typical_education.pct)}% of workers).`,
    );
  if (fs.job_zone && sourceZone && fs.job_zone > sourceZone)
    out.push(`${fs.education_label} — more preparation than your current job.`);
  if (fs.certification_note) out.push(`${fs.certification_note}.`);
  if (fs.on_the_job_training?.label && fs.on_the_job_training.label !== "None")
    out.push(`On-the-job training: ${fs.on_the_job_training.label.toLowerCase()}.`);
  return out;
}

function row(t: TransitionItem, sourceZone: number | null): Row {
  const extra = t.job_zone && sourceZone && t.job_zone > sourceZone ? EXTRA_EDU[t.job_zone]! : "None";
  return {
    slug: t.slug,
    title: t.title,
    match: t.match,
    median: t.median,
    payChange: t.wage_is_group ? null : t.pay_change_pct,
    groupWage: t.wage_is_group ? t.wage_source_title : null,
    jobZone: t.job_zone,
    extraEdu: extra,
    skillImp: t.skill_imp,
  };
}

export function buildFromPage(slug: string): FromPageModel | null {
  const hub = hubData(slug);
  const occ = hub ? undefined : occBySlug(slug);
  if (!hub && (!occ || occ.thin)) return null;
  const tr = hub ?? transitionsFor(slug);
  if (!tr || !tr.top.length) return null;

  const name = hub ? hub.plural : displayName(occ!.title);
  const pluralLower = inSentence(name);
  const singularLower = hub ? inSentence(hub.singular) : inSentence(singularize(name.split(" (")[0]!));
  const zone = tr.job_zone;
  const rows = tr.top.map((t) => row(t, zone));
  const skills3 = tr.source_skills.slice(0, 3).map((s) => s.name.toLowerCase());

  // gaps that show up most often across the top 10
  const gapCount = new Map<string, number>();
  for (const t of tr.top.slice(0, 10)) for (const g of t.skill_gaps) gapCount.set(g, (gapCount.get(g) ?? 0) + 1);
  const skillsToLearn = [...gapCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([g]) => g);

  const upClose: UpClose[] = tr.top.slice(0, 3).map((t) => {
    const o = occByCode(t.code);
    return {
      slug: t.slug,
      title: t.title,
      match: t.match,
      median: t.median,
      payChange: t.wage_is_group ? null : t.pay_change_pct,
      groupWage: t.wage_is_group ? t.wage_source_title : null,
      firstStep: firstStepLines(o, zone),
      skillsToLearn: t.skill_gaps,
      hardParts: (o?.downsides ?? []).map((d) => d.label),
    };
  });

  const members = tr.members.map((m) => ({ title: displayName(m.title), slug: m.slug }));
  const sourceLabel =
    hub && members.length > 1
      ? `Compared with ${listJoin(members.map((m) => inSentence(displayName(m.title))))}: employment-weighted median ${money(tr.baseline_median)}.`
      : `Compared with ${hub ? members[0]!.title : occ!.title}, median ${money(tr.baseline_median)}.`;

  const best = rows[0]!;
  const intro =
    `${hub ? hub.plural : name} build ${listJoin(skills3)} skills that carry over to other work. ` +
    `Below are ${rows.length} careers ranked by how closely their skills match, with pay from BLS May 2025. ` +
    `The closest match is ${best.title} (${best.match}%).`;

  // FAQ answers are assembled from the table data only (no outside claims).
  const top3 = rows.slice(0, 3);
  const comparable = rows.filter((r) => r.payChange != null);
  const higher = comparable
    .filter((r) => (r.payChange ?? 0) > 0)
    .sort((a, b) => (b.payChange ?? 0) - (a.payChange ?? 0));
  const noExtra = rows.filter((r) => r.extraEdu === "None").length;
  const grad = rows.filter((r) => r.extraEdu === "Graduate degree").map((r) => r.title);
  const faq: Faq[] = [
    {
      q: `What jobs can former ${pluralLower} do?`,
      a:
        `The closest matches are ${listJoin(top3.map((r) => `${r.title} (${r.match}% skill match${r.median ? `, median ${money(r.median)}` : ""})`))}, ` +
        `based on O*NET 31.0 data and BLS May 2025 pay.`,
    },
    {
      q: `Which ${singularLower} career changes pay more?`,
      a: higher.length
        ? `Among the ${rows.length} matches, ${higher.length} pay more than ${pluralLower} at the median. The biggest increases: ${listJoin(
            higher.slice(0, 3).map((r) => `${r.title} (${signedPct(r.payChange)}, ${money(r.median)})`),
          )}.`
        : `None of the ${rows.length} closest matches pays more than ${pluralLower} at the national median (BLS May 2025). Higher-paying moves usually need more training.`,
    },
    {
      q: `Do former ${pluralLower} need another degree?`,
      a:
        `${noExtra} of the ${rows.length} matches usually need no more education than you have now, based on O*NET Job Zones.` +
        (grad.length
          ? ` ${grad.length === 1 ? "One usually needs" : `${grad.length} usually need`} a graduate degree: ${listJoin(grad.slice(0, 3))}.`
          : ""),
    },
    {
      q: "How is the skill match calculated?",
      a: "We compare the importance of skills, knowledge, work activities and interests in O*NET 31.0 for your job and every other career, then adjust for extra preparation and big pay drops. The full method is on our Methodology page.",
    },
  ];

  // Tahap 6 rule: titles 30–60 characters (the " | Career Change Finder" suffix is not counted here)
  const base = `Jobs for Former ${name}`;
  const shortBase = `Jobs for Former ${seoName(name)}`;
  const title = fitTitle(
    [`${base}: ${rows.length} Careers That Use Your Skills`, `${base}: ${rows.length} Career Options`, base, shortBase],
    shortBase, // a longer unique title beats a clipped duplicate; the intent comes first
  );
  const description = clip(
    `${rows.length} careers for former ${pluralLower}, ranked by skill match with BLS median pay and pay change. Closest match: ${best.title} (${best.match}%).`,
    160,
  );

  return {
    slug,
    isHub: Boolean(hub),
    name,
    singularLower,
    pluralLower,
    sourceLabel,
    baseline: tr.baseline_median,
    members,
    intro,
    sourceSkills: tr.source_skills,
    rows,
    skillsToLearn,
    upClose,
    similarInField: tr.similar_in_field.slice(0, 8).map((t) => ({ slug: t.slug, title: t.title, match: t.match })),
    faq,
    title,
    description,
  };
}
