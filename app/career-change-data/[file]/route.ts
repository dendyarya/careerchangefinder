import { buildFromPage } from "@/lib/careerChangePage";
import { careerChangeSources, singleCodeHubRedirects } from "@/lib/data/server";

// Static JSON for the Career Change Tool: /career-change-data/<career-slug>.json
export const dynamicParams = false;

export function generateStaticParams() {
  const folded = singleCodeHubRedirects().map((r) => r.from);
  return [...careerChangeSources(), ...folded].map((s) => ({ file: `${s}.json` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.json$/, "");
  const folded = new Map(singleCodeHubRedirects().map((r) => [r.from, r.to]));
  const pageSlug = folded.get(slug) ?? slug;
  const m = buildFromPage(pageSlug);
  if (!m) return new Response("Not found", { status: 404 });
  return Response.json(
    {
      pageSlug,
      name: m.name,
      pluralLower: m.pluralLower,
      sourceLabel: m.sourceLabel,
      skills: m.sourceSkills.map((s) => s.name),
      rows: m.rows,
    },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}
