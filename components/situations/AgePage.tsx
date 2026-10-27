import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { AgeBars, AgeTable } from "@/components/situations/AgeTable";
import { AGE_SLUGS, buildAgePage, type AgeSlug } from "@/lib/agePages";
import { meta } from "@/lib/data";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";

const HIGHLIGHT: Record<AgeSlug, string[]> = {
  "at-30": ["16-19", "20-24", "25-34"],
  "at-40": ["45-54", "55-64", "65+"],
  "at-50": ["55-64", "65+"],
};
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function AgePage({ slug }: { slug: AgeSlug }) {
  const m = buildAgePage(slug);
  const url = `${SITE.url}/career-change/${slug}`;
  const stats: [string, string][] = [
    ["Median age of U.S. workers", `${m.aw.median_age}`],
    [`U.S. ${m.shareWords}`, pct(m.nat[m.key])],
    ["U.S. median pay", money(m.aw.us_median_pay)],
    ["Careers on this page", `${m.main.length}`],
  ];
  const others = AGE_SLUGS.filter((s) => s !== slug);
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: `Career Change at ${m.age}` }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change " highlight={`at ${m.age}`} />
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

      <AdSlot size="leaderboard" id={`${slug}-top`} />

      <section aria-labelledby="h-best" className="flex flex-col gap-4">
        <H2 id="h-best">
          {m.main.length} careers to start at {m.age}
        </H2>
        <p className="m-0 max-w-[860px] text-slate">Each one {m.rule}. Highest pay first.</p>
        <AgeTable rows={m.main} caption={`Careers to start at ${m.age}, highest median pay first`} shareLabel={m.shareLabel} />
        <p className="m-0 text-small text-muted">
          {m.shareLabel}: share of employed people, BLS CPS 2025 (Table 11b). “Broader group”: BLS publishes ages only
          for a wider group of jobs. Supervisor and manager jobs are left out because they are usually filled by
          promotion. <Link href="/methodology">Methodology</Link>
        </p>
      </section>

      {m.notes.length > 0 && (
        <section aria-labelledby="h-notes" className="flex flex-col gap-3 rounded-xl border-[1.5px] border-[#F2D58A] bg-[#FFF9E8] p-6 md:p-8">
          <h2 id="h-notes" className="m-0 font-display text-[26px] font-bold">
            Read before you start
          </h2>
          {m.notes.map((n) => {
            const row = m.main.find((r) => r.code === n.code)!;
            return (
              <div key={n.code} id={`note-${row.slug}`} className="flex scroll-mt-6 flex-col gap-1.5">
                <h3 className="m-0 text-h3">{n.title}</h3>
                <p className="m-0">{n.text}</p>
                <p className="m-0 text-small text-muted">
                  Sources:{" "}
                  {n.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && " · "}
                      <a href={s.url} rel="noopener">
                        {s.label}
                      </a>
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </section>
      )}

      <section aria-labelledby="h-fast" className="flex flex-col gap-4">
        <H2 id="h-fast">Faster options: {m.fastWords} of preparation</H2>
        <p className="m-0 max-w-[860px] text-slate">
          The {m.fast.length} careers from the list above that usually need {m.fastWords} of preparation.
        </p>
        <AgeTable rows={m.fast} caption={`Careers to start at ${m.age} with ${m.fastWords} of preparation`} shareLabel={m.shareLabel} show={15} />
      </section>

      <section aria-labelledby="h-age" className="grid gap-8 rounded-xl bg-panel p-6 md:grid-cols-[1fr_1.2fr] md:p-8">
        <div className="flex flex-col gap-3">
          <H2 id="h-age">{m.faq[0]!.q}</H2>
          <p className="m-0">{m.faq[0]!.a}</p>
        </div>
        <div>
          <p className="m-0 mb-3 font-bold">U.S. workers by age</p>
          <AgeBars bands={m.aw.bands_k} total={m.aw.total_k} highlight={HIGHLIGHT[slug]} />
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

      <FreeHelp who={`Career changers in their ${m.age}s`} />
      <FaqSection title={`Questions about changing careers at ${m.age}`} items={m.faq} />
      <RelatedLinks
        links={[
          ...others.map((s) => ({ label: `Career change at ${s.slice(3)}`, href: `/career-change/${s}` })),
          { label: "Career Change Quiz", href: "/career-change/quiz" },
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
          { label: "Jobs Without a Degree", href: "/careers/education/no-degree" },
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
          headline: `Career Change at ${m.age}`,
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
          name: `Careers to start at ${m.age}`,
          url,
          numberOfItems: m.main.length,
          itemListElement: m.main.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE.url}/careers/${r.slug}` })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Careers to start at ${m.age}: pay, preparation and worker age`,
          description: m.description,
          url,
          creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
          isBasedOn: ["https://www.bls.gov/cps/cpsaat11b.htm", "https://www.bls.gov/oes/", "https://www.onetcenter.org/database.html"],
          license: "https://creativecommons.org/licenses/by/4.0/",
          variableMeasured: ["Median annual pay", `Share of ${m.shareWords}`, "Median worker age", "O*NET Job Zone"],
        }}
      />
    </div>
  );
}
