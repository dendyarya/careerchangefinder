import { SITE } from "@/lib/site";
import { SITEMAP_NAMES, sitemapEntries, urlsetXml, type SitemapName } from "@/lib/sitemap";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => SITEMAP_NAMES.map((n) => ({ name: `${n}.xml` }));

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.xml$/, "") as SitemapName;
  if (!SITEMAP_NAMES.includes(name)) return new Response("Not found", { status: 404 });
  const entries = await sitemapEntries(name);
  if (entries.length > 50000) throw new Error(`sitemap ${name} has ${entries.length} URLs (max 50,000)`);
  return new Response(urlsetXml(SITE.url, entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
