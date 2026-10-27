import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { AgeBars, AgeTable } from "@/components/situations/AgeTable";
import { buildAt40 } from "@/lib/agePages";
import { meta } from "@/lib/data";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";

export function At40Page() {
  const m = buildAt40();
  const url = `${SITE.url}/career-change/at-40`;
  const stats: [string, string][] = [
    ["Median age of U.S. workers", `${m.aw.median_age}`],
    ["Workers aged 45 or older", `${Math.round(m.aw.share_45_plus * 100)}%`],
    ["U.S. median pay", money(m.aw.us_median_pay)],
    ["Careers on this page", `${m.main.length}`],
  ];
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Career Change at 40" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change " highlight="at 40" />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="BLS CPS 2025, BLS OEWS May 2025 and O*NET 31.0" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[30px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <AdSlot size="leaderboard" id="at40-top" />

      <section aria-labelledby="h-best" className="flex flex-col gap-4">
        <H2 id="h-best">{m.main.length} careers to start at 40</H2>
        <p className="m-0 max-w-[860px] text-slate">
          Each one usually takes two years or less to prepare for, pays more than the U.S. median and has at least{" "}
          {Math.round(m.aw.share_45_plus * 100)}% of its workers aged 45 or older. Highest pay first.
        </p>
        <AgeTable rows={m.main} caption="Careers to start at 40, highest median pay first" />
        <p className="m-0 text-small text-muted">
          Workers 45+: share of employed people aged 45 or older, BLS CPS 2025 (Table 11b). “Broader group”: BLS
          publishes ages only for a wider group of jobs. Supervisor and manager jobs are left out because they are
          usually filled by promotion. <Link href="/methodology">Methodology</Link>
        </p>
      </section>

      <section aria-labelledby="h-fast" className="flex flex-col gap-4">
        <H2 id="h-fast">Faster options: a year of preparation or less</H2>
        <p className="m-0 max-w-[860px] text-slate">
          The {m.fast.length} careers from the list above that usually need a year or less of training.
        </p>
        <AgeTable rows={m.fast} caption="Careers to start at 40 with a year or less of preparation" show={15} />
      </section>

      <section aria-labelledby="h-age" className="grid gap-8 rounded-xl bg-panel p-6 md:grid-cols-[1fr_1.2fr] md:p-8">
        <div className="flex flex-col gap-3">
          <H2 id="h-age">Is 40 too old to change careers?</H2>
          <p className="m-0">
            No. Half of all U.S. workers are older than {m.aw.median_age}, and {Math.round(m.aw.share_45_plus * 100)}%
            are 45 or older. At 40, most people still have 25 working years or more ahead.
          </p>
          <p className="m-0 text-small text-muted">BLS Current Population Survey, 2025 annual averages (11 months).</p>
        </div>
        <div>
          <p className="m-0 mb-3 font-bold">U.S. workers by age</p>
          <AgeBars bands={m.aw.bands_k} total={m.aw.total_k} />
        </div>
      </section>

      <section aria-labelledby="h-you" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-8">
        <h2 id="h-you" className="m-0 font-display text-[30px] font-bold">
          Start from the job you have now
        </h2>
        <p className="m-0 max-w-[760px] text-footer-text">
          Your experience counts. Enter your current job to see which careers use the skills you already have.
        </p>
        <div className="max-w-[720px] rounded-lg bg-white p-5 text-ink">
          <HomeJobPicker />
        </div>
      </section>

      <FreeHelp who="Career changers over 40" />
      <FaqSection title="Questions about changing careers at 40" items={m.faq} />
      <RelatedLinks
        links={[
          { label: "Career Change Quiz", href: "/career-change/quiz" },
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
          { label: "Jobs Without a Degree", href: "/careers/education/no-degree" },
          { label: "Career Change Tool", href: "/career-change/tool" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Worker ages: U.S. Bureau of Labor Statistics, Current Population Survey, 2025 annual averages, Table 11b
        (October 2025 was not collected). Pay: BLS Occupational Employment and Wage Statistics, May 2025. Preparation:
        O*NET 31.0 Job Zones, USDOL/ETA (CC BY 4.0).
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Career Change at 40",
          description: m.description,
          url,
          dateModified: meta.built_at,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Careers to start at 40",
          url,
          numberOfItems: m.main.length,
          itemListElement: m.main.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE.url}/careers/${r.slug}` })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "Careers to start at 40: pay, preparation and worker age",
          description: m.description,
          url,
          creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
          isBasedOn: ["https://www.bls.gov/cps/cpsaat11b.htm", "https://www.bls.gov/oes/", "https://www.onetcenter.org/database.html"],
          license: "https://creativecommons.org/licenses/by/4.0/",
          variableMeasured: ["Median annual pay", "Share of workers aged 45+", "Median worker age", "O*NET Job Zone"],
        }}
      />
    </div>
  );
}
