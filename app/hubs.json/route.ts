import { hubs } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    hubs.map((h) => ({ slug: h.slug, singular: h.singular, plural: h.plural })),
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}
