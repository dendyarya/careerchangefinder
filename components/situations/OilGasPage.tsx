import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { meta } from "@/lib/data";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { buildOilGas, type IndRow } from "@/lib/oilGas";
import { SITE } from "@/lib/site";

const th = "px-4 py-3.5 text-small font-extrabold";

function IndTable({ rows, caption, show = 25, industry }: { rows: IndRow[]; caption: string; show?: number; industry: string }) {
  const part = (list: IndRow[], start: number, cap: string) => (
    <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
      <table className="w-full min-w-[760px] border-collapse text-body">
        <caption className="sr-only">{cap}</caption>
        <thead>
          <tr className="border-b-[1.5px] border-mist bg-panel text-left">
            <th scope="col" className={`w-[48px] ${th}`}>#</th>
            <th scope="col" className={th}>Job</th>
            <th scope="col" className={th}>Jobs in {industry}</th>
            <th scope="col" className={th}>Median pay here</th>
            <th scope="col" className={th}>U.S. median for the job</th>
            <th scope="col" className={th}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.soc} className="border-t border-mist align-top">
              <td className="px-4 py-3 font-display font-bold text-muted">{start + i + 1}</td>
              <td className="px-4 py-3">
                {r.slug ? (
                  <Link href={`/careers/${r.slug}`} className="font-bold text-ink">
                    {r.title}
                  </Link>
                ) : (
                  <span className="font-bold">{r.title}</span>
                )}
              </td>
              <td className="px-4 py-3 font-display font-semibold tabular">{r.jobs == null ? "—" : r.jobs.toLocaleString("en-US")}</td>
              <td className="px-4 py-3 font-display font-semibold tabular">{money(r.median)}</td>
              <td className="px-4 py-3 font-display font-semibold tabular">{money(r.usMedian)}</td>
              <td className={`px-4 py-3 font-display font-semibold tabular ${payChangeTone(r.diff)}`}>{signedPct(r.diff)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  const rest = rows.slice(show);
  return (
    <div className="flex flex-col gap-3">
      {part(rows.slice(0, show), 0, caption)}
      {rest.length > 0 && (
        <details>
          <summary className="cursor-pointer font-extrabold text-primary">Show the other {rest.length} jobs</summary>
          <div className="mt-3">{part(rest, show, `${caption} (continued)`)}</div>
        </details>
      )}
    </div>
  );
}

export function OilGasPage() {
  const m = buildOilGas();
  const url = `${SITE.url}/career-change/to-oil-and-gas`;
  const stats: [string, string][] = [
    ["Jobs in oil and gas extraction and pipelines", m.total.toLocaleString("en-US")],
    ["Median pay, oil and gas extraction", money(m.ex.total.median)],
    ["Job types in extraction", String(m.exRows.length)],
  ];
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Career Change to Oil and Gas" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change to " highlight="oil and gas" />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="BLS OEWS May 2025 (industry estimates)" />
      </section>
      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[30px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <AdSlot size="leaderboard" id="oil-top" />
      <section aria-labelledby="h-ex" className="flex flex-col gap-4">
        <H2 id="h-ex">Jobs in oil and gas extraction</H2>
        <p className="m-0 max-w-[860px] text-slate">Every job BLS reports in Oil and Gas Extraction (NAICS 2111), most jobs first.</p>
        <IndTable rows={m.exRows} caption="Jobs in oil and gas extraction" industry="extraction" />
        <p className="m-0 text-small text-muted">
          Difference: median pay in oil and gas extraction against the job&apos;s national median in all industries. BLS OEWS May
          2025.
        </p>
      </section>
      {m.payMore.length > 0 && (
        <section aria-labelledby="h-more" className="flex flex-col gap-4">
          <H2 id="h-more">Jobs that pay at least 20% more in oil and gas</H2>
          <IndTable rows={m.payMore} caption="Jobs that pay at least 20% more in oil and gas extraction" show={15} industry="extraction" />
        </section>
      )}
      {m.pipes.map((p) => (
        <section key={p.naics} aria-labelledby={`h-${p.slug}`} className="flex flex-col gap-4">
          <H2 id={`h-${p.slug}`}>{p.title}</H2>
          <p className="m-0 max-w-[860px] text-slate">
            {p.total.employment?.toLocaleString("en-US")} jobs, median pay {money(p.total.median)} (NAICS {p.naics.slice(0, 4)}).
          </p>
          <IndTable rows={p.rows} caption={`Jobs in ${p.title}`} show={10} industry="pipelines" />
        </section>
      ))}
      <section aria-labelledby="h-you" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-8">
        <h2 id="h-you" className="m-0 font-display text-[30px] font-bold">
          Check your own job
        </h2>
        <p className="m-0 max-w-[760px] text-footer-text">Enter your current job to see which careers use the skills you already have.</p>
        <div className="max-w-[720px] rounded-lg bg-white p-5 text-ink">
          <HomeJobPicker />
        </div>
      </section>
      <FreeHelp />
      <FaqSection title="Questions about oil and gas jobs" items={m.faq} />
      <RelatedLinks
        links={[
          { label: "Career change to skilled trades", href: "/career-change/to-skilled-trades" },
          { label: "Jobs Without a Degree", href: "/careers/education/no-degree" },
          { label: "Highest-paying jobs", href: "/careers/salary/high-paying" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Employment and pay: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025,
        national industry-specific estimates (NAICS 2111, 4861, 4862) and national cross-industry estimates.
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Career Change to Oil and Gas",
          description: m.description,
          url,
          dateModified: meta.built_at,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
    </div>
  );
}
