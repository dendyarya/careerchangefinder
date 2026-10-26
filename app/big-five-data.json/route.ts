import { traitPages } from "@/lib/data/traitPages";

export const dynamic = "force-static";

/** Top 5 careers per trait end, for the Big Five results screen. */
export function GET() {
  const out = Object.fromEntries(
    Object.entries(traitPages()).map(([k, v]) => [
      k,
      v.careers.slice(0, 5).map((c) => ({ slug: c.slug, title: c.title, median: c.median })),
    ]),
  );
  return Response.json(out, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
