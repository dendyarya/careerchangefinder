import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, JsonLd } from "@/components/page/Common";
import { headingId } from "@/lib/guides/headings";
import { getNews, listNews, newsDay, newsTime } from "@/lib/news";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await listNews();
  // Next needs at least one param for a static route; "__none" renders a 404.
  return all.length ? all.map((n) => ({ slug: n.slug })) : [{ slug: "__none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await getNews(slug);
  if (!n) return {};
  const base = pageMeta({
    title: n.meta.title,
    description: n.meta.description,
    path: `/news/${slug}`,
    noindex: n.meta.draft,
  });
  const image = { url: `${SITE.url}${n.meta.heroImage}`, width: 1200, height: 675, alt: n.meta.heroImageAlt };
  return {
    ...base,
    alternates: { ...base.alternates, types: { "application/rss+xml": "/news/feed.xml" } },
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: n.meta.publishedAt,
      modifiedTime: n.meta.updatedAt ?? n.meta.publishedAt,
      section: "News",
      images: [image],
    },
    twitter: { ...base.twitter, card: "summary_large_image", images: [image.url] },
    // large previews in Google Discover
    robots: base.robots ?? { index: true, follow: true, "max-image-preview": "large" as const },
  };
}

const text = (c: React.ReactNode): string => (typeof c === "string" ? c : Array.isArray(c) ? c.map(text).join("") : "");

const components = {
  table: ({ children }: { children?: React.ReactNode }) => <table tabIndex={0}>{children}</table>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 id={headingId(text(children))}>{children}</h2>,
  a: ({ href = "", children }: { href?: string; children?: React.ReactNode }) =>
    href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} rel="noopener">
        {children}
      </a>
    ),
};

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await getNews(slug);
  if (!n) notFound();
  const { meta, Content, minutes, words } = n;
  const more = (await listNews()).filter((x) => x.slug !== slug).slice(0, 3);
  const url = `${SITE.url}/news/${slug}`;

  return (
    <>
      <article>
        <header className="border-b-[1.5px] border-mist bg-ice">
          <div className="mx-auto flex max-w-[860px] flex-col gap-4 px-4 pt-8 pb-10 md:px-8">
            <Breadcrumbs items={[{ name: "News", href: "/news" }, { name: meta.title }]} />
            {meta.draft && (
              <span className="self-start rounded-sm bg-loss px-3 py-0.5 text-small font-extrabold text-white">
                Draft: not visible on the live site
              </span>
            )}
            <h1 className="m-0 text-[clamp(32px,4.6vw,52px)] leading-[1.08] tracking-[-0.03em]">{meta.title}</h1>
            <p className="m-0 text-lead text-slate">{meta.description}</p>
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px] text-muted">
              <span>
                By{" "}
                <Link href="/editorial-policy" className="font-bold text-ink" rel="author">
                  {meta.author}
                </Link>
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={meta.publishedAt}>{newsTime(meta.publishedAt)}</time>
              {meta.updatedAt && meta.updatedAt !== meta.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated <time dateTime={meta.updatedAt}>{newsTime(meta.updatedAt)}</time>
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{minutes} min read</span>
            </p>
          </div>
        </header>

        <div className="mx-auto flex max-w-[860px] flex-col gap-10 px-4 pt-8 pb-20 md:px-8">
          <figure className="m-0 flex flex-col gap-2">
            <Image
              src={meta.heroImage}
              alt={meta.heroImageAlt}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 860px) 100vw, 800px"
              className="h-auto w-full rounded-[20px] border-[1.5px] border-mist"
            />
            {meta.heroImageCaption && (
              <figcaption className="text-small text-muted">{meta.heroImageCaption}</figcaption>
            )}
          </figure>

          <div className="article-body">
            <Content components={components} />
          </div>

          <AdSlot size="rectangle" id="news-body" />

          <section
            aria-label="About this article"
            className="flex flex-col gap-1 rounded-[22px] border-[1.5px] border-mist p-[22px] text-[16px] text-slate"
          >
            <strong className="text-ink">{meta.author}</strong>
            <span>
              Our news articles report on official U.S. labor data and our own research. Read our{" "}
              <Link href="/editorial-policy">editorial policy and corrections</Link>. Spotted an error? Email{" "}
              <a href="mailto:contact@careerchangefinder.com">contact@careerchangefinder.com</a>.
            </span>
          </section>

          {more.length > 0 && (
            <section aria-label="More news" className="flex flex-col gap-3">
              <strong className="font-display text-[22px]">More news</strong>
              <ul className="m-0 grid list-none gap-3.5 p-0 md:grid-cols-3">
                {more.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/news/${o.slug}`}
                      className="flex h-full flex-col gap-1 rounded-[20px] bg-ice p-[18px] font-bold text-ink no-underline hover:text-primary"
                    >
                      <span>{o.title}</span>
                      <span className="text-small font-normal text-muted">{newsDay(o.publishedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: meta.title,
          description: meta.description,
          image: [`${SITE.url}${meta.heroImage}`],
          datePublished: meta.publishedAt,
          dateModified: meta.updatedAt ?? meta.publishedAt,
          wordCount: words,
          articleSection: "News",
          inLanguage: "en-US",
          isAccessibleForFree: true,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          author: { "@type": "Organization", name: meta.author, url: `${SITE.url}/editorial-policy` },
          publisher: {
            "@type": "Organization",
            name: SITE.name,
            url: SITE.url,
            logo: { "@type": "ImageObject", url: `${SITE.url}/icon-512.png` },
          },
        }}
      />
    </>
  );
}
