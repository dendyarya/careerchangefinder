/**
 * "Jobs Similar to [job]" page model. Uses the "similar" list in data/processed/transitions: pure
 * O*NET 31.0 profile similarity (no related-occupation bonus, no preparation or pay penalties), so it
 * answers "which jobs are most alike", not "where should I move". Pay: BLS OEWS May 2025.
 */
import "server-only";
import type { Faq } from "@/components/page/Common";
import {
  displayName,
  occBySlug,
  occupations,
  singleCodeHubRedirects,
  transitionsFor,
  type SimilarItem,
} from "@/lib/data/server";
import { clip, inSentence, listJoin, money, signedPct } from "@/lib/format";
import { fitTitle, seoName } from "@/lib/seoName";
import { isPublished } from "@/lib/published";
import { readContent, type SimilarContent } from "@/lib/content";

export const SIMILAR_N = 20;
const JZ_TEXT: Record<number, string> = {
  1: "Little or no preparation",
  2: "A high school diploma",
  3: "Training or an associate degree",
  4: "A bachelor's degree",
  5: "A graduate degree",
};

export interface SimilarRow {
  slug: string;
  title: string;
  match: number;
  median: number | null;
  group: boolean;
  payChange: number | null;
  jobZone: number | null;
  sameField: boolean;
}

export interface SimilarModel {
  slug: string;
  name: string;
  nameLower: string;
  title: string;
  description: string;
  intro: string;
  median: number | null;
  group: boolean;
  jobZone: number | null;
  rows: SimilarRow[];
  lessPrep: SimilarRow[];
  payMore: SimilarRow[];
  into: { slug: string; title: string; match: number }[];
  fromPage: string;
  faq: Faq[];
  /** written text (content/generated/similar), when there is one */
  shared: string | null;
  sourceSkills: { name: string; value: number }[];
}

export function similarSlugs(): string[] {
  return occupations()
    .filter((o) => !o.thin && transitionsFor(o.slug) && isPublished("jobs-similar-to", o.slug))
    .map((o) => o.slug);
}

const toRow = (t: SimilarItem): SimilarRow => ({
  slug: t.slug,
  title: t.title,
  match: t.similarity,
  median: t.median,
  group: t.wage_is_group,
  payChange: t.wage_is_group ? null : t.pay_change_pct,
  jobZone: t.job_zone,
  sameField: t.same_field,
});

export function buildSimilar(slug: string): SimilarModel | null {
  const o = occBySlug(slug);
  if (!o || o.thin) return null;
  const tr = transitionsFor(slug);
  if (!tr) return null;
  const name = displayName(o.title);
  const nameLower = inSentence(name);
  const rows = (tr.similar ?? []).slice(0, SIMILAR_N).map(toRow);
  if (!rows.length) return null;
  const jz = o.job_zone;
  const lessPrep = jz ? rows.filter((r) => r.jobZone != null && r.jobZone < jz).slice(0, 6) : [];
  // "pay more" section: only careers that usually need no more preparation than this one,
  // so a nurse is not shown "physician" as an easy pay rise
  const payHigher = rows.filter((r) => r.payChange != null && r.payChange > 0);
  const payMore = payHigher
    .filter((r) => jz != null && r.jobZone != null && r.jobZone <= jz)
    .sort((a, b) => b.payChange! - a.payChange!)
    .slice(0, 6);
  const into = (tr.into ?? []).slice(0, 10);
  const folded = new Map(singleCodeHubRedirects().map((r) => [r.from, r.to]));
  const median = o.wage?.median ?? null;
  const group = Boolean(o.wage?.is_group);
  const top3 = rows.slice(0, 3).map((r) => displayName(r.title));

  const sn = seoName(name, o.code);
  const title = fitTitle(
    [`Jobs Similar to ${name}: ${rows.length} Careers Like It`, `Jobs Similar to ${name}`, `Jobs Like ${name}`, `Jobs Like ${sn}`],
    `Jobs Like ${sn}`, // long names: over 60 characters, but never the same as the career profile title
  );
  const description = clip(
    `The ${rows.length} careers most like ${nameLower} by skills, knowledge and daily work, with pay and education compared. O*NET 31.0 and BLS May 2025 data.`,
    160,
  );
  const intro = `The careers below use the most similar skills, knowledge and work activities to ${nameLower}, according to O*NET 31.0. The closest ${rows.length === 1 ? "is" : "are"} ${listJoin(top3)}.`;

  const faq: Faq[] = [
    {
      q: `What jobs are most similar to ${nameLower}?`,
      a: `By O*NET 31.0 data, the closest are ${listJoin(rows.slice(0, 5).map((r) => `${displayName(r.title)} (${r.match}% similar)`))}.`,
    },
    payHigher.length
      ? {
          q: `Which jobs like ${nameLower} pay more?`,
          a: `Among the ${rows.length} most similar careers, ${listJoin(
            [...payHigher]
              .sort((a, b) => b.payChange! - a.payChange!)
              .slice(0, 3)
              .map((r) => `${displayName(r.title)} (${money(r.median)}, ${signedPct(r.payChange)}; usually ${(JZ_TEXT[r.jobZone ?? 0] ?? "preparation varies").toLowerCase()})`),
          )} have the highest BLS median pay compared with ${nameLower} (${money(median)}).${payMore.length ? ` Without more preparation than ${nameLower} usually need: ${listJoin(payMore.slice(0, 3).map((r) => displayName(r.title)))}.` : ""}`,
        }
      : {
          q: `Do jobs like ${nameLower} pay more?`,
          a: `None of the ${rows.length} most similar careers has a higher BLS median pay than ${nameLower} where a direct comparison is possible.`,
        },
    {
      q: "How is the similarity percentage worked out?",
      a: "We compare how important each transferable skill, knowledge area, work activity and interest area is in both jobs (O*NET 31.0 ratings) with a weighted correlation. 100% would mean the same profile. Unlike our career-change matches, pay and extra schooling do not lower the similarity on this page.",
    },
  ];

  const model: SimilarModel = {
    slug,
    name,
    nameLower,
    title,
    description,
    intro,
    median,
    group,
    jobZone: jz,
    rows,
    lessPrep,
    payMore,
    into,
    fromPage: `/career-change/from-${folded.get(slug) ?? slug}`,
    faq,
    shared: null,
    sourceSkills: tr.source_skills,
  };
  const c = readContent<SimilarContent>("similar", slug);
  if (c) {
    model.intro = c.intro;
    model.shared = c.shared;
    // written answers first; drop the automatic pay answer (every written text covers pay), keep the
    // "most similar" list and the method note
    model.faq = [...c.faq, faq[0]!, faq[2]!];
  }
  return model;
}
