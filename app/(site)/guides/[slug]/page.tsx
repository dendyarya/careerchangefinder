import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, JsonLd } from "@/components/page/Common";
import { getGuide, listGuides } from "@/lib/guides";
import { headingId } from "@/lib/guides/headings";
import { monthYear } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { isPublished } from "@/lib/published";

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = (await listGuides()).filter((g) => isPublished("guides", g.slug));
  // Next needs at least one param for a static route; "__none" renders a 404.
  return all.length ? all.map((g) => ({ slug: g.slug })) : [{ slug: "__none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGuide(slug);
  if (!g) return {};
  return pageMeta({
    title: g.meta.title,
    description: g.meta.description,
    path: `/guides/${slug}`,
    noindex: g.meta.draft,
  });
}

const CATEGORY = { "career-change": "Career change guide", "choosing-a-major": "Choosing a major" } as const;

const text = (c: React.ReactNode): string => (typeof c === "string" ? c : Array.isArray(c) ? c.map(text).join("") : "");

const components = {
  h2: ({ children }: { children?: React.ReactNode }) => <h2 id={headingId(text(children))}>{children}</h2>,
  a: ({ href = "", children }: { href?: string; children?: React.ReactNode }) =>
    href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} rel="noopener nofollow">
        {children}
      </a>
    ),
};

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGuide(slug);
  if (!g) notFound();
  const { meta, Content, toc, minutes } = g;
  const others = (await listGuides()).filter((x) => x.slug !== slug).slice(0, 3);
  const updated = meta.updatedAt ?? meta.publishedAt;

  return (
    <>
      <section className="border-b-[1.5px] border-mist bg-ice">
        <div className="mx-auto flex max-w-[980px] flex-col gap-4 px-4 pt-8 pb-12 md:px-8">
          <Breadcrumbs items={[{ name: "Guides", href: "/guides" }, { name: meta.title }]} />
          <span className="self-start rounded-full bg-mist px-3.5 py-0.5 text-small font-extrabold text-primary">
            {CATEGORY[meta.category]}
          </span>
          {meta.draft && (
            <span className="self-start rounded-sm bg-loss px-3 py-0.5 text-small font-extrabold text-white">
              Draft: not visible on the live site
            </span>
          )}
          <h1 className="m-0 text-[clamp(38px,5.5vw,64px)] leading-[1.05] tracking-[-0.03em]">{meta.title}</h1>
          <p className="m-0 text-lead text-slate">{meta.description}</p>
          <p className="m-0 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[16px] text-muted">
            <strong className="text-ink">{meta.author}</strong>
            <span aria-hidden="true">·</span>
            <span>Updated {updated ? monthYear(updated) : "—"}</span>
            <span aria-hidden="true">·</span>
            <span>{minutes} min read</span>
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1180px] items-start gap-14 px-4 pt-12 pb-20 md:px-8 lg:grid-cols-[260px_1fr]">
        <aside
          aria-label="On this page"
          className="sticky top-6 hidden flex-col gap-2.5 rounded-[22px] bg-ice p-[22px] text-[16px] lg:flex"
        >
          <strong className="text-small text-muted">On this page</strong>
          {toc.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className="border-l-[3px] border-transparent pl-2.5 text-slate no-underline hover:border-accent hover:text-ink"
            >
              {h.text}
            </a>
          ))}
        </aside>

        <div className="flex max-w-[760px] min-w-0 flex-col gap-10">
          <article className="article-body">
            <Content components={components} />
          </article>

          <aside
            aria-label="Try the Career Change Tool"
            className="flex flex-wrap items-center gap-[18px] rounded-lg bg-primary p-[26px] text-white"
          >
            <div className="flex flex-[1_1_320px] flex-col gap-1">
              <strong className="font-display text-[24px]">See your skills on a map</strong>
              <span className="text-mist">
                Type your current job and see which careers use the same skills, with real pay.
              </span>
            </div>
            <Link
              href="/career-change/tool"
              className="rounded-full bg-white px-6 py-3.5 font-extrabold text-ink no-underline hover:bg-sky hover:text-ink"
            >
              Open the Career Change Tool
            </Link>
          </aside>

          <AdSlot size="rectangle" id="guide-body" />

          <section
            aria-label="About the author"
            className="flex items-center gap-4 rounded-[22px] border-[1.5px] border-mist p-[22px] text-[16px] text-slate"
          >
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky font-extrabold text-primary"
            >
              {meta.author.slice(0, 1)}
            </span>
            <span>
              <strong className="text-ink">{meta.author}</strong>. Numbers come from O*NET 31.0 and BLS OEWS May 2025.
              See <Link href="/methodology">how we work</Link>.
            </span>
          </section>

          {others.length > 0 && (
            <section aria-label="Related guides" className="flex flex-col gap-3">
              <strong className="font-display text-[22px]">Keep reading</strong>
              <div className="grid gap-3.5 md:grid-cols-3">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/guides/${o.slug}`}
                    className="rounded-[20px] bg-ice p-[18px] font-bold text-ink no-underline hover:text-primary"
                  >
                    {o.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: meta.title,
          description: meta.description,
          datePublished: meta.publishedAt,
          dateModified: updated,
          author: { "@type": "Organization", name: meta.author },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          mainEntityOfPage: `${SITE.url}/guides/${slug}`,
          ...(meta.heroImage ? { image: `${SITE.url}${meta.heroImage}` } : {}),
        }}
      />
    </>
  );
}
