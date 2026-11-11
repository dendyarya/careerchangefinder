import { listNews } from "@/lib/news";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 feed of the 30 newest news articles. */
export async function GET() {
  const items = (await listNews()).slice(0, 30);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${esc(SITE.name)} News</title>
<link>${SITE.url}/news</link>
<atom:link href="${SITE.url}/news/feed.xml" rel="self" type="application/rss+xml"/>
<description>Jobs, pay and hiring news from official U.S. data and our own research.</description>
<language>en-us</language>
${items[0] ? `<lastBuildDate>${new Date(items[0].updatedAt ?? items[0].publishedAt).toUTCString()}</lastBuildDate>\n` : ""}${items
    .map(
      (n) => `<item>
<title>${esc(n.title)}</title>
<link>${SITE.url}/news/${n.slug}</link>
<guid isPermaLink="true">${SITE.url}/news/${n.slug}</guid>
<pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate>
<description>${esc(n.description)}</description>
<media:content url="${SITE.url}${esc(n.heroImage)}" medium="image" width="1200" height="675"/>
</item>`,
    )
    .join("\n")}
</channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
