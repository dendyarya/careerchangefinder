import Link from "next/link";
import { meta } from "@/lib/data";
import { monthYear } from "@/lib/format";
import { SITE } from "@/lib/site";

/** JSON-LD block. Data only (never executed), escaped so "</script>" cannot break out. */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[16px] text-muted">
        <ol className="m-0 flex list-none flex-wrap gap-x-1.5 p-0">
          {all.map((c, i) => (
            <li key={c.name} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">›</span>}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href}>{c.name}</Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            ...(c.href ? { item: `${SITE.url}${c.href}` } : {}),
          })),
        }}
      />
    </>
  );
}

/** H1 with the highlighted part, as in the mockups. */
export function PageTitle({ before, highlight, after }: { before?: string; highlight: string; after?: string }) {
  return (
    <h1 className="m-0 text-h1 leading-[1.02] tracking-[-0.03em]">
      {before}
      <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,var(--color-sky)_58%)] px-1">
        {highlight}
      </span>
      {after}
    </h1>
  );
}

export function UpdatedLine({ sources = "O*NET 31.0 and BLS OEWS May 2025" }: { sources?: string }) {
  return (
    <p className="m-0 text-small text-muted">
      Updated {monthYear(meta.built_at)} · Data: {sources} · <Link href="/methodology">How we match careers</Link>
    </p>
  );
}

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
      {children}
    </h2>
  );
}

/** Free public help (approved 26 Oct 2026): American Job Centers and CareerOneStop training finder. */
export function FreeHelp({ who }: { who?: string }) {
  return (
    <section aria-labelledby="free-help" className="rounded-xl bg-ink p-6 text-white md:p-8">
      <h2 id="free-help" className="m-0 font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">
        Free help near you
      </h2>
      <p className="mt-3 mb-0 max-w-[760px] text-footer-text">
        {who ? `${who} can` : "You can"} get free career counseling, job search help and, if you qualify, help paying
        for training through American Job Centers, which are funded by the U.S. Department of Labor.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx"
          rel="noopener"
          className="inline-flex h-[52px] items-center rounded-full bg-white px-6 text-ui font-extrabold text-ink no-underline hover:bg-sky hover:text-ink"
        >
          Find an American Job Center
        </a>
        <a
          href="https://www.careeronestop.org/FindTraining/find-training.aspx"
          rel="noopener"
          className="inline-flex h-[52px] items-center rounded-full border-[1.5px] border-footer-rule px-6 text-ui font-extrabold text-white no-underline hover:border-white hover:text-white"
        >
          Find training programs
        </a>
      </div>
      <p className="mt-4 mb-0 text-small text-footer-muted">
        Links go to CareerOneStop, sponsored by the U.S. Department of Labor.
      </p>
    </section>
  );
}

export function RelatedLinks({
  links,
  cta,
}: {
  links: { label: string; href: string }[];
  cta?: { label: string; href: string };
}) {
  return (
    <section aria-labelledby="keep-exploring" className="flex flex-col gap-3.5">
      <h2 id="keep-exploring" className="m-0 font-display text-[28px] font-bold">
        Keep exploring
      </h2>
      <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-[14px] border-[1.5px] border-mist px-[18px] py-3 font-bold text-ink no-underline hover:border-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
        {cta && (
          <li>
            <Link
              href={cta.href}
              className="block rounded-[14px] bg-primary px-[18px] py-3 font-extrabold text-white no-underline hover:bg-ink hover:text-white"
            >
              {cta.label}
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

export function SourcesBox({ children }: { children?: React.ReactNode }) {
  return (
    <section
      aria-label="Data sources"
      className="rounded-[20px] border-[1.5px] border-mist bg-panel px-6 py-[22px] text-[16px] text-slate"
    >
      <strong className="text-ink">Sources.</strong>{" "}
      {children ?? (
        <>
          Skills, tasks and education: O*NET 31.0 Database, U.S. Department of Labor, Employment and Training
          Administration (USDOL/ETA), used under CC BY 4.0. Pay: U.S. Bureau of Labor Statistics, Occupational
          Employment and Wage Statistics, May 2025.
        </>
      )}{" "}
      <Link href="/data-sources">Data Sources &amp; Licenses</Link>
    </section>
  );
}

export interface Faq {
  q: string;
  a: string;
}
export function FaqSection({ title, items }: { title: string; items: Faq[] }) {
  return (
    <section aria-labelledby="faq" className="flex max-w-[940px] flex-col">
      <h2 id="faq" className="m-0 mb-[18px] text-h2 leading-[1.08] tracking-[-0.03em]">
        {title}
      </h2>
      {items.map((f, i) => (
        <details
          key={f.q}
          open={i === 0}
          className={`border-t-[1.5px] border-mist px-1 py-[18px] ${i === items.length - 1 ? "border-b-[1.5px]" : ""}`}
        >
          <summary className="cursor-pointer text-[19px] font-extrabold">{f.q}</summary>
          <p className="mt-2.5 mb-0 text-slate">{f.a}</p>
        </details>
      ))}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </section>
  );
}

export function Bar({ value, max = 5, label }: { value: number; max?: number; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-4 font-bold">
        <span>{label}</span>
        <span className="font-display tabular">{value.toFixed(2)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-[7px] bg-mist" aria-hidden="true">
        <div className="h-full rounded-[7px] bg-primary" style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}
