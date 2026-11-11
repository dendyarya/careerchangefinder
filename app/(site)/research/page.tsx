import Link from "next/link";
import { Breadcrumbs, H2, JsonLd, PageTitle, SourcesBox } from "@/components/page/Common";
import { monthYear } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { betterPayStudy, pct1, sameJobStudy, STUDIES } from "@/lib/studies";

export const metadata = pageMeta({
  title: "Research: Data Studies on Careers and Pay",
  description:
    "Original data studies on U.S. careers and pay from O*NET and BLS data: better-paying career moves and how much the state changes pay for the same job.",
  path: "/research",
});

export default function ResearchHub() {
  const bp = betterPayStudy().national;
  const sj = sameJobStudy();
  const cards: Record<string, { summary: string; stats: [string, string][] }> = {
    "same-job-different-pay": {
      summary: `We compared state pay for ${sj.national.careers} careers. For the typical career, the best-paying state pays ${Math.round(sj.national.median_gap * 100)}% more than the lowest-paying one, with a same-job pay index for every state.`,
      stats: [
        [pct1(sj.national.share_double), "of careers pay at least double in the top state"],
        [`+${pct1(sj.states[0]!.index)}`, `same-job pay in ${sj.states[0]!.state === "District of Columbia" ? "D.C." : sj.states[0]!.state}`],
      ],
    },
    "better-paying-careers": {
      summary: `We checked ${bp.jobs} careers for a close match that pays at least 10% more and usually needs no extra schooling, nationally and in every state.`,
      stats: [
        [pct1(bp.share_jobs), "of careers have a better-paying close match"],
        [pct1(bp.median_closest_raise), "typical pay gap to the closest one"],
      ],
    },
  };
  const studies = [...STUDIES].sort((a, b) => b.published.localeCompare(a.published));

  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-12 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Research" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Data studies on " highlight="careers and pay" />
        <p className="m-0 text-lead">
          Original analysis of public U.S. government data (O*NET and BLS). Every figure is recalculated by a separate
          script before it is published, and journalists, researchers and teachers are free to use it with a link.
        </p>
      </section>

      <section aria-labelledby="studies" className="flex flex-col gap-6">
        <H2 id="studies">All studies</H2>
        {studies.map((st) => {
          const c = cards[st.slug]!;
          return (
            <Link
              key={st.slug}
              href={`/research/${st.slug}`}
              className="grid gap-6 rounded-lg border-[1.5px] border-mist bg-white p-[30px] text-ink no-underline shadow-md hover:border-primary hover:text-ink md:grid-cols-[1.4fr_1fr] md:items-center"
            >
              <span className="flex flex-col gap-3">
                <span className="font-display text-small font-bold text-primary">Data study · {monthYear(st.published)}</span>
                <span className="font-display text-[26px] leading-tight font-bold">{st.title}</span>
                <span className="text-muted">{c.summary}</span>
                <span className="font-extrabold text-primary">Read the study →</span>
              </span>
              <span className="grid grid-cols-2 gap-3">
                {c.stats.map(([v, l]) => (
                  <span key={l} className="flex flex-col gap-1 rounded-[16px] bg-ice px-5 py-4">
                    <span className="font-display text-[30px] leading-none font-bold tabular">{v}</span>
                    <span className="text-small text-muted">{l}</span>
                  </span>
                ))}
              </span>
            </Link>
          );
        })}
      </section>

      <section aria-labelledby="use" className="article-body max-w-[860px]">
        <h2 id="use">Using our data</h2>
        <p>
          You may quote and chart any figure from these studies. Please cite &quot;{SITE.name}&quot; with the study title
          and link to the study page. Studies with tables offer CSV downloads. For how match scores and pay comparisons
          work, see our <Link href="/methodology">methodology</Link>; for the datasets and their licenses, see{" "}
          <Link href="/data-sources">data sources and licenses</Link>. Questions about a figure? Use the{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </section>

      <SourcesBox>
        O*NET 31.0 Database (USDOL/ETA, CC BY 4.0) and BLS Occupational Employment and Wage Statistics, May 2025
        (national and state). Calculations by {SITE.name}.
      </SourcesBox>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Research: data studies on careers and pay",
          url: `${SITE.url}/research`,
          hasPart: studies.map((st) => ({
            "@type": "Article",
            headline: st.title,
            url: `${SITE.url}/research/${st.slug}`,
            datePublished: st.published,
          })),
        }}
      />
    </div>
  );
}
