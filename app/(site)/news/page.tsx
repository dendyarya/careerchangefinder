import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, JsonLd, PageTitle } from "@/components/page/Common";
import { listNews, newsDay } from "@/lib/news";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

const base = pageMeta({
  title: "News: Jobs, Pay and Career Change",
  description:
    "News on U.S. jobs, pay and hiring from official BLS releases and our own data, with what each report means for people changing careers.",
  path: "/news",
});
export const metadata = {
  ...base,
  alternates: { ...base.alternates, types: { "application/rss+xml": "/news/feed.xml" } },
};

export default async function NewsIndex() {
  const all = await listNews();
  const [lead, ...rest] = all;
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "News" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle highlight="News" />
        <p className="m-0 text-lead">
          Jobs, pay and hiring news from official U.S. data releases and our own research, and what each report means
          if you are changing careers. <Link href="/editorial-policy">How we report</Link> ·{" "}
          <a href="/news/feed.xml">RSS feed</a>
        </p>
      </section>

      {!lead && <p className="m-0 rounded-md bg-ice p-6">The first stories are on their way. Check back soon.</p>}

      {lead && (
        <Link
          href={`/news/${lead.slug}`}
          className="grid gap-6 rounded-lg border-[1.5px] border-mist bg-white p-5 text-ink no-underline shadow-md hover:border-primary hover:text-ink md:grid-cols-[1.25fr_1fr] md:items-center md:p-6"
        >
          <Image
            src={lead.heroImage}
            alt={lead.heroImageAlt}
            width={1200}
            height={675}
            priority
            sizes="(max-width: 768px) 100vw, 680px"
            className="h-auto w-full rounded-[16px] border-[1.5px] border-mist"
          />
          <span className="flex flex-col gap-3">
            <span className="text-small font-bold text-primary">
              <time dateTime={lead.publishedAt}>{newsDay(lead.publishedAt)}</time>
            </span>
            <span className="font-display text-[clamp(24px,2.6vw,32px)] leading-tight font-bold">{lead.title}</span>
            <span className="text-muted">{lead.description}</span>
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <section aria-labelledby="latest" className="flex flex-col gap-5">
          <h2 id="latest" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
            Latest
          </h2>
          <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/news/${n.slug}`}
                  className="flex h-full flex-col gap-3 rounded-lg border-[1.5px] border-mist bg-white p-4 text-ink no-underline hover:border-primary hover:text-ink"
                >
                  <Image
                    src={n.heroImage}
                    alt={n.heroImageAlt}
                    width={1200}
                    height={675}
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="h-auto w-full rounded-[12px] border-[1.5px] border-mist"
                  />
                  {n.draft && (
                    <span className="self-start rounded-sm bg-loss px-2 text-small font-extrabold text-white">Draft</span>
                  )}
                  <span className="font-display text-[21px] leading-tight font-bold">{n.title}</span>
                  <span className="text-[16px] text-muted">{n.description}</span>
                  <span className="mt-auto text-small text-muted">
                    <time dateTime={n.publishedAt}>{newsDay(n.publishedAt)}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "News: jobs, pay and career change",
          url: `${SITE.url}/news`,
          hasPart: all.slice(0, 20).map((n) => ({
            "@type": "NewsArticle",
            headline: n.title,
            url: `${SITE.url}/news/${n.slug}`,
            datePublished: n.publishedAt,
          })),
        }}
      />
    </div>
  );
}
