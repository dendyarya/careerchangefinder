import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { meta } from "@/lib/data";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { buildGovPage, FED_MIN_JOBS, GOV_COMPARE_MIN, GOV_MIN_JOBS, type GovRow } from "@/lib/govPage";
import { SITE } from "@/lib/site";

const n = (x: number | null) => (x == null ? "—" : x.toLocaleString("en-US"));
const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);
type Col = { label: string; cell: (r: GovRow) => React.ReactNode };

function Table({ rows, cols, caption, show = 25 }: { rows: GovRow[]; cols: Col[]; caption: string; show?: number }) {
  const part = (list: GovRow[], start: number, cap: string) => (
    <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
      <table className="w-full min-w-[760px] border-collapse text-body">
        <caption className="sr-only">{cap}</caption>
        <thead>
          <tr className="border-b-[1.5px] border-mist bg-panel text-left">
            <th scope="col" className="w-[48px] px-4 py-3.5 text-small font-extrabold">#</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Career</th>
            {cols.map((c) => (
              <th key={c.label} scope="col" className="px-4 py-3.5 text-small font-extrabold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.slug} className="border-t border-mist align-top">
              <td className="px-4 py-3 font-display font-bold text-muted">{start + i + 1}</td>
              <td className="px-4 py-3">
                <Link href={`/careers/${r.slug}`} className="font-bold text-ink decoration-accent decoration-2 underline-offset-4 hover:text-primary">
                  {r.title}
                </Link>
              </td>
              {cols.map((c) => (
                <td key={c.label} className="px-4 py-3 font-display font-semibold tabular">
                  {c.cell(r)}
                </td>
              ))}
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
          <summary className="cursor-pointer font-extrabold text-primary">Show the other {rest.length} careers</summary>
          <div className="mt-3">{part(rest, show, `${caption} (continued)`)}</div>
        </details>
      )}
    </div>
  );
}

const diffCell = (r: GovRow) => <span className={payChangeTone(r.diff)}>{signedPct(r.diff)}</span>;

export function GovPage() {
  const m = buildGovPage();
  const url = `${SITE.url}/career-change/to-government`;
  const a = m.all;
  const stats: [string, string][] = [
    ["Government jobs", `${(a.government.employment! / 1e6).toFixed(1)} million`],
    ["Federal · State · Local", `${(a.federal.employment! / 1e6).toFixed(1)} · ${(a.state.employment! / 1e6).toFixed(1)} · ${(a.local.employment! / 1e6).toFixed(1)} M`],
    ["Median pay, government", money(a.government.median)],
    ["Median pay, private", money(a.private.median)],
  ];
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Government Jobs" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change to " highlight="government jobs" />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="BLS OEWS May 2025 (by ownership) and O*NET 31.0" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[28px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <AdSlot size="leaderboard" id="gov-top" />

      <section aria-labelledby="h-main" className="flex flex-col gap-4">
        <H2 id="h-main">Careers with the most government jobs</H2>
        <p className="m-0 max-w-[860px] text-slate">
          {m.main.length} careers with at least {GOV_MIN_JOBS.toLocaleString("en-US")} jobs in federal, state or local
          government, most jobs first.
        </p>
        <Table
          rows={m.main}
          caption="Careers with the most government jobs"
          cols={[
            { label: "Government jobs", cell: (r) => n(r.govJobs) },
            { label: "Share in government", cell: (r) => pct(r.govShare) },
            { label: "Median pay, government", cell: (r) => money(r.govMedian) },
            { label: "Median pay, private", cell: (r) => money(r.privMedian) },
            { label: "Difference", cell: diffCell },
          ]}
        />
        <p className="m-0 text-small text-muted">
          Government includes public schools and hospitals and the U.S. Postal Service. Supervisor and manager jobs are
          left out because they are usually filled by promotion. <Link href="/methodology">Methodology</Link>
        </p>
      </section>

      <section aria-labelledby="h-more" className="flex flex-col gap-4">
        <H2 id="h-more">Where government pays at least 10% more</H2>
        <p className="m-0 max-w-[860px] text-slate">
          {m.payMore.length} careers where the government median is at least 10% above the private median (both with at
          least {GOV_COMPARE_MIN.toLocaleString("en-US")} jobs). Biggest difference first.
        </p>
        <Table
          rows={m.payMore}
          caption="Careers where government pays at least 10% more than private employers"
          show={15}
          cols={[
            { label: "Median pay, government", cell: (r) => money(r.govMedian) },
            { label: "Median pay, private", cell: (r) => money(r.privMedian) },
            { label: "Difference", cell: diffCell },
            { label: "Government jobs", cell: (r) => n(r.govJobs) },
          ]}
        />
      </section>

      <section aria-labelledby="h-fed" className="flex flex-col gap-4">
        <H2 id="h-fed">Biggest federal careers</H2>
        <p className="m-0 max-w-[860px] text-slate">
          {m.federal.length} careers with at least {FED_MIN_JOBS.toLocaleString("en-US")} federal jobs. Federal jobs are
          listed on{" "}
          <a href="https://www.usajobs.gov/" rel="noopener">
            USAJOBS.gov
          </a>
          .
        </p>
        <Table
          rows={m.federal}
          caption="Careers with the most federal jobs"
          show={15}
          cols={[
            { label: "Federal jobs", cell: (r) => n(r.fedJobs) },
            { label: "Median pay, federal", cell: (r) => money(r.fedMedian) },
            { label: "Median pay, private", cell: (r) => money(r.privMedian) },
          ]}
        />
      </section>

      <section aria-labelledby="h-you" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-8">
        <h2 id="h-you" className="m-0 font-display text-[30px] font-bold">
          Start from the job you have now
        </h2>
        <p className="m-0 max-w-[760px] text-footer-text">
          Enter your current job to see which careers use the skills you already have.
        </p>
        <div className="max-w-[720px] rounded-lg bg-white p-5 text-ink">
          <HomeJobPicker />
        </div>
      </section>

      <FreeHelp who="People moving into government work" />
      <FaqSection title="Questions about government jobs" items={m.faq} />
      <RelatedLinks
        links={[
          { label: "Career change at 40", href: "/career-change/at-40" },
          { label: "Highest-paying jobs", href: "/careers/salary/high-paying" },
          { label: "Jobs Without a Degree", href: "/careers/education/no-degree" },
          { label: "Career Change Tool", href: "/career-change/tool" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Employment and pay: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025,
        national cross-industry estimates by ownership. Career titles: O*NET 31.0, USDOL/ETA (CC BY 4.0).
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Career Change to Government Jobs",
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
          "@type": "Dataset",
          name: "Government vs private pay by career, May 2025",
          description: m.description,
          url,
          creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
          isBasedOn: ["https://www.bls.gov/oes/2025/may/oessrci.htm"],
          license: "https://creativecommons.org/licenses/by/4.0/",
          variableMeasured: ["Government employment", "Median annual pay, government", "Median annual pay, private"],
        }}
      />
    </div>
  );
}
