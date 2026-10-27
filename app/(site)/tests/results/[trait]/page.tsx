import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox } from "@/components/page/Common";
import { traitPages } from "@/lib/data/traitPages";
import { clip, money } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { parseResultSlug, RESULT_SLUGS, TRAITS } from "@/lib/traits";
import { isPublished } from "@/lib/published";

export const dynamicParams = false;
export const generateStaticParams = () =>
  RESULT_SLUGS.filter((trait) => isPublished("tests", `results/${trait}`)).map((trait) => ({ trait }));

const EDU: Record<number, string> = {
  1: "Little or no preparation",
  2: "High school",
  3: "Certificate or associate",
  4: "Bachelor's degree",
  5: "Graduate degree",
};

export async function generateMetadata({ params }: { params: Promise<{ trait: string }> }) {
  const { trait } = await params;
  const p = parseResultSlug(trait);
  if (!p) return {};
  const info = p.trait[p.end];
  const name = info.label.replace(" (Introversion)", "");
  return pageMeta({
    title: `${name}: Meaning, Strengths and Careers`,
    description: clip(
      `What ${name.toLowerCase()} means in the Big Five, its typical strengths, and ${info.listTitle.toLowerCase()}, with BLS median pay.`,
      160,
    ),
    path: `/tests/results/${trait}`,
  });
}

export default async function TraitResultPage({ params }: { params: Promise<{ trait: string }> }) {
  const { trait } = await params;
  const p = parseResultSlug(trait);
  if (!p) notFound();
  const { trait: t, end } = p;
  const info = t[end];
  const other = t[end === "high" ? "low" : "high"];
  const data = traitPages()[trait]!;
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs
        items={[
          { name: "Tests", href: "/tests" },
          { name: "Big Five Traits Explained", href: "/tests/results/big-five" },
          { name: info.label },
        ]}
      />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle highlight={info.label} />
        <p className="m-0 text-lead">{info.short}</p>
        <p className="m-0 text-slate">
          {t.name} is one of the Big Five personality traits. It describes{" "}
          {t.about.charAt(0).toLowerCase() + t.about.slice(1)} Everyone falls somewhere on the scale; neither end is
          better.
        </p>
      </section>

      <section
        aria-labelledby="strengths"
        className="flex flex-col gap-4 rounded-lg border-[1.5px] border-mist bg-ice p-6 md:p-8"
      >
        <h2 id="strengths" className="m-0 font-display text-[28px] font-bold">
          Typical strengths
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {info.strengths.map((s) => (
            <li key={s} className="flex items-center gap-3 font-bold">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-accent" />
              {s}
            </li>
          ))}
        </ul>
      </section>

      <AdSlot size="leaderboard" id="trait-top" />

      <section aria-labelledby="careers" className="flex flex-col gap-4">
        <H2 id="careers">{info.listTitle}</H2>
        <p className="m-0 max-w-[860px] text-slate">
          Ranked by how much these jobs rely on the O*NET 31.0 Work Styles linked to {t.name}:{" "}
          {data.styles.join(" and ")}.
          {data.min_job_zone ? " Only careers that usually need training or a degree are listed." : ""}
        </p>
        <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {data.careers.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/careers/${c.slug}`}
                className="flex h-full items-start gap-3 rounded-md border-[1.5px] border-mist px-4 py-3.5 text-ink no-underline hover:border-primary"
              >
                <span className="font-display font-bold text-muted">{i + 1}</span>
                <span className="flex flex-1 flex-col">
                  <span className="font-bold">{c.title}</span>
                  <span className="text-small text-muted">{c.job_zone ? EDU[c.job_zone] : ""}</span>
                </span>
                <span className="shrink-0 font-display font-semibold tabular">{money(c.median)}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="m-0 text-small text-muted">
          Pay: BLS OEWS May 2025 national median (— when only a broader group figure exists).
        </p>
      </section>

      {data.majors.length > 0 && (
        <section aria-labelledby="majors" className="flex flex-col gap-4">
          <h2 id="majors" className="m-0 font-display text-[28px] font-bold">
            College majors that lead to these careers
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {data.majors.map((m) => (
              <li key={m.slug} className="rounded-full border-[1.5px] border-mist px-4 py-2 font-bold">
                {m.title}
              </li>
            ))}
          </ul>
          <p className="m-0 text-small text-muted">
            From the NCES CIP–SOC crosswalk. Major pages open in a later stage.
          </p>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-5 rounded-lg bg-primary p-6 text-white md:p-8">
        <div className="flex flex-[1_1_360px] flex-col gap-1">
          <strong className="font-display text-[24px]">Find out where you score</strong>
          <span className="text-mist">50 statements, about 8 minutes, no sign-up.</span>
        </div>
        <Link
          href="/big-five-personality-test"
          className="rounded-full bg-white px-6 py-3.5 font-extrabold text-ink no-underline hover:bg-sky hover:text-ink"
        >
          Take the Big Five test
        </Link>
      </section>

      <RelatedLinks
        links={[
          { label: other.label, href: `/tests/results/${end === "high" ? "low" : "high"}-${t.id}` },
          ...TRAITS.filter((x) => x.id !== t.id)
            .slice(0, 3)
            .map((x) => ({ label: x.high.label, href: `/tests/results/high-${x.id}` })),
          { label: "All five traits explained", href: "/tests/results/big-five" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Trait descriptions: Career Change Finder, based on the IPIP Big-Five Factor Markers (public domain). Careers:
        O*NET 31.0 Work Styles (USDOL/ETA, CC BY 4.0). Pay: BLS OEWS May 2025. Majors: NCES CIP 2020 to SOC 2018
        crosswalk.
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: info.listTitle,
          url: `${SITE.url}/tests/results/${trait}`,
          itemListElement: data.careers.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.title,
            url: `${SITE.url}/careers/${c.slug}`,
          })),
        }}
      />
    </div>
  );
}
