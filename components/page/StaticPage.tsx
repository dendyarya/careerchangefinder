import Link from "next/link";
import { Breadcrumbs, JsonLd, PageTitle } from "@/components/page/Common";
import { headingId } from "@/lib/guides/headings";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { loadStaticPage, STATIC_PAGES, type StaticSlug } from "@/lib/staticPages";

const text = (c: React.ReactNode): string => (typeof c === "string" ? c : Array.isArray(c) ? c.map(text).join("") : "");

const components = {
  // wide tables scroll sideways on phones; tabIndex lets keyboard users scroll them (WCAG 2.1.1)
  table: ({ children }: { children?: React.ReactNode }) => <table tabIndex={0}>{children}</table>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 id={headingId(text(children))}>{children}</h2>,
  a: ({ href = "", children }: { href?: string; children?: React.ReactNode }) =>
    href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : href.startsWith("mailto:") ? (
      <a href={href}>{children}</a>
    ) : (
      <a href={href} rel="noopener">
        {children}
      </a>
    ),
};

export function staticMeta(slug: StaticSlug) {
  const c = STATIC_PAGES[slug];
  return pageMeta({ title: c.title, description: c.description, path: `/${slug}` });
}

export async function StaticPage({ slug }: { slug: StaticSlug }) {
  const { cfg, Content, toc } = await loadStaticPage(slug);
  const name = cfg.h1.join("");
  return (
    <>
      <section className="border-b-[1.5px] border-mist bg-ice">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pt-8 pb-10 md:px-8">
          <Breadcrumbs items={[{ name: name.charAt(0).toUpperCase() + name.slice(1) }]} />
          <PageTitle before={cfg.h1[0]} highlight={cfg.h1[1]} />
        </div>
      </section>
      <div
        className={`mx-auto grid max-w-[1180px] items-start gap-14 px-4 pt-10 pb-20 md:px-8 ${toc.length ? "lg:grid-cols-[260px_1fr]" : ""}`}
      >
        {toc.length > 0 && (
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
        )}
        <article className="article-body max-w-[760px] min-w-0">
          <Content components={components} />
        </article>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": cfg.type,
          name: cfg.title,
          description: cfg.description,
          url: `${SITE.url}/${slug}`,
          isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
        }}
      />
    </>
  );
}
