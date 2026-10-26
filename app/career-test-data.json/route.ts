import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

/** Career data the Free Career Test needs in the browser (O*NET interests, Job Zone, work context percentiles, BLS pay). */
export function GET() {
  const d = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "tests", "career-attributes.json"), "utf8"),
  ) as {
    careers: Record<string, unknown>[];
  };
  const careers = d.careers.map((c) => ({
    code: c.code,
    slug: c.slug,
    title: c.title,
    job_zone: c.job_zone,
    riasec: c.riasec,
    median: (c as { wage_is_group?: boolean }).wage_is_group ? null : c.median,
    attrs: c.attrs,
  }));
  return Response.json(careers, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
