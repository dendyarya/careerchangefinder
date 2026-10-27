import { meta } from "@/lib/data";
import { SITE } from "@/lib/site";
import { indexXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export function GET() {
  return new Response(indexXml(SITE.url, meta.built_at.slice(0, 10)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
