import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

/** Majors for the College Major Quiz: interest profile, trait values and up to 3 linked careers (best paid first). */
export function GET() {
  const root = path.join(process.cwd(), "data");
  const mp = JSON.parse(fs.readFileSync(path.join(root, "tests", "major-profiles.json"), "utf8")) as {
    majors: {
      cip: string;
      title: string;
      slug: string;
      careers: string[];
      riasec: Record<string, number>;
      traits: Record<string, number | null>;
    }[];
  };
  const occ = JSON.parse(fs.readFileSync(path.join(root, "processed", "occupations.json"), "utf8")) as {
    code: string;
    slug: string;
    title: string;
    wage: { median: number | null; is_group: boolean } | null;
  }[];
  const byCode = new Map(occ.map((o) => [o.code, o]));
  const majors = mp.majors.map((m) => ({
    cip: m.cip,
    title: m.title,
    slug: m.slug,
    careers: m.careers,
    riasec: m.riasec,
    traits: { openness: m.traits.openness ?? null, conscientiousness: m.traits.conscientiousness ?? null },
    top: m.careers
      .map((c) => byCode.get(c)!)
      .filter(Boolean)
      .sort((a, b) => (b.wage?.is_group ? 0 : (b.wage?.median ?? 0)) - (a.wage?.is_group ? 0 : (a.wage?.median ?? 0)))
      .slice(0, 3)
      .map((o) => ({ slug: o.slug, title: o.title, median: o.wage && !o.wage.is_group ? o.wage.median : null })),
  }));
  return Response.json(majors, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
