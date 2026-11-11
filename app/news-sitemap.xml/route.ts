import { listNews } from "@/lib/news";
import { SITE } from "@/lib/site";

// Google News sitemap: only articles published in the last 2 days, built on each request (cached 15 min).
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  const since = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const items = (await listNews()).filter((n) => !n.draft && Date.parse(n.publishedAt) >= since).slice(0, 1000);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items
  .map(
    (n) => `<url>
<loc>${SITE.url}/news/${n.slug}</loc>
<news:news>
<news:publication><news:name>${esc(SITE.name)}</news:name><news:language>en</news:language></news:publication>
<news:publication_date>${n.publishedAt}</news:publication_date>
<news:title>${esc(n.title)}</news:title>
</news:news>
</url>`,
  )
  .join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
  });
}
