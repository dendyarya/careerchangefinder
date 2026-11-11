import { buildFromPage } from "@/lib/careerChangePage";
import { buildProfile, profileSlugs } from "@/lib/careerProfile";
import { occBySlug } from "@/lib/data/server";
import { careerChangeSources } from "@/lib/data/server";
import { SITE } from "@/lib/site";
import { buildSimilar, similarSlugs } from "@/lib/similarJobs";

// The data behind each page, for writing and checking its text (Tahap 7). Built only locally (no SITE_ENV):
// never on production, and not on staging, where ~1,750 extra files only slowed the upload.
const LOCAL_ONLY = !SITE.indexable && !process.env.SITE_ENV;
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  if (!LOCAL_ONLY) return [{ kind: "none", slug: "none" }];
  return [
    ...careerChangeSources().map((slug) => ({ kind: "from", slug })),
    ...similarSlugs().map((slug) => ({ kind: "similar", slug })),
    ...profileSlugs()
      .filter((slug) => !occBySlug(slug)?.thin)
      .map((slug) => ({ kind: "careers", slug })),
  ];
}

export async function GET(_: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  if (!LOCAL_ONLY) return new Response("Not found", { status: 404 });
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
  if (kind === "careers") {
    const p = buildProfile(slug);
    if (!p || p.o.thin) return new Response("Not found", { status: 404 });
    const { o } = p;
    const w = o.wage;
    return Response.json({
      page: `/careers/${slug}`,
      name: p.name,
      wage: w
        ? { median: w.median, p10: w.p10, p25: w.p25, p75: w.p75, p90: w.p90, employment: w.employment, is_group: w.is_group, bls_title: w.bls_title }
        : null,
      states: p.states.map((s) => ({ state: s.state, median: s.median, employment: s.employment })),
      job_zone: o.job_zone,
      education_label: o.first_step.education_label,
      education_dist: o.education_dist.map((e) => ({ label: e.label, pct: Math.round(e.pct) })),
      holland: o.holland,
      riasec: o.riasec,
      essential_skills: o.essential_skills,
      knowledge: o.knowledge.slice(0, 5),
      work_styles: o.work_styles,
      downsides: o.downsides.map((d) => d.label),
      tasks: o.tasks.slice(0, 6),
      fit: p.fit.map((f) => ({ text: f.text, percentile: f.percentile })),
      out: p.out,
      into: p.into,
      majors: o.majors.map((x) => x.title),
      alt_titles: o.alt_titles.slice(0, 6),
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
