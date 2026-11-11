import { buildFromPage } from "@/lib/careerChangePage";
import { careerChangeSources } from "@/lib/data/server";
import { SITE } from "@/lib/site";
import { buildSimilar, similarSlugs } from "@/lib/similarJobs";

// The data behind each page, for writing and checking its text (Tahap 7). Never built on production.
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  if (SITE.indexable) return [{ kind: "none", slug: "none" }];
  return [
    ...careerChangeSources().map((slug) => ({ kind: "from", slug })),
    ...similarSlugs().map((slug) => ({ kind: "similar", slug })),
  ];
}

export async function GET(_: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  if (SITE.indexable) return new Response("Not found", { status: 404 });
  if (kind === "similar") {
    const s = buildSimilar(slug);
    if (!s) return new Response("Not found", { status: 404 });
    return Response.json({
      page: `/jobs-similar-to/${slug}`,
      name: s.name,
      median: s.median,
      broader_group_wage: s.group,
      job_zone: s.jobZone,
      source_skills: s.sourceSkills,
      careers: s.rows.map((r, i) => ({ rank: i + 1, title: r.title, match: r.match, median: r.median, pay_change_pct: r.payChange, job_zone: r.jobZone, same_field: r.sameField })),
      pay_more_same_prep: s.payMore.map((r) => r.title),
      less_prep: s.lessPrep.map((r) => r.title),
    });
  }
  if (kind !== "from") return new Response("Not found", { status: 404 });
  const m = buildFromPage(slug);
  if (!m) return new Response("Not found", { status: 404 });
  const facts = {
    page: `/career-change/from-${slug}`,
    name: m.name,
    plural_lower: m.pluralLower,
    singular_lower: m.singularLower,
    is_hub: m.isHub,
    members: m.members.map((x) => x.title),
    baseline_median: m.baseline,
    source_skills: m.sourceSkills,
    skills_to_learn: m.skillsToLearn,
    careers: m.rows.map((r, i) => ({
      rank: i + 1,
      title: r.title,
      match: r.match,
      median: r.median,
      pay_change_pct: r.payChange,
      broader_group_wage: r.groupWage,
      extra_education: r.extraEdu,
    })),
    similar_in_field: m.similarInField,
    up_close: m.upClose.map((u) => ({ title: u.title, first_step: u.firstStep, skills_to_learn: u.skillsToLearn, hard_parts: u.hardParts })),
  };
  return Response.json(facts);
}
