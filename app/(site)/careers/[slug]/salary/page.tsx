import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { buildSalary, salarySlugs } from "@/lib/salary";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => salarySlugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = buildSalary((await params).slug);
  if (!m) return {};
  return pageMeta({ title: m.title, description: m.description, path: `/careers/${m.o.slug}/salary` });
}

const np = (n: number | null) => (n == null ? "Not published" : money(n));

export default async function SalaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const m = buildSalary((await params).slug);
  if (!m) notFound();
  const w = m.o.wage!;
  const spread: [string, number | null][] = [
    ["Lowest 10%", w.p10],
    ["25th percentile", w.p25],
    ["Median", w.median],
    ["75th percentile", w.p75],
    ["Top 10%", w.p90],
  ];
  const max = Math.max(...spread.map(([, v]) => v ?? 0), 1);
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Careers", href: "/careers" }, { name: m.name, href: `/careers/${m.o.slug}` }, { name: "Salary by state" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before={`${m.name} `} highlight="Salary by State" />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="BLS OEWS May 2025" />
      </section>

      <section aria-labelledby="h-us" className="flex max-w-[920px] flex-col gap-4">
        <H2 id="h-us">U.S. pay range</H2>
        <dl className="m-0 flex flex-col gap-3">
          {spread.map(([label, v]) => (
            <div key={label} className="grid grid-cols-[140px_1fr_auto] items-center gap-3 md:grid-cols-[180px_1fr_auto]">
              <dt className={label === "Median" ? "font-bold" : ""}>{label}</dt>
              <span className="h-3 overflow-hidden rounded-md bg-mist" aria-hidden="true">
                <span className={`block h-full rounded-md ${label === "Median" ? "bg-primary" : "bg-sky"}`} style={{ width: `${((v ?? 0) / max) * 100}%` }} />
              </span>
              <dd className="m-0 font-display font-semibold tabular">{np(v)}</dd>
            </div>
          ))}
        </dl>
        <p className="m-0 text-small text-muted">
          Annual pay, all U.S. workers in this job{m.group ? ` (broader BLS group “${w.bls_title}”)` : ""}.
          {w.employment ? ` About ${w.employment.toLocaleString("en-US")} jobs.` : ""}
        </p>
      </section>

      <AdSlot size="leaderboard" id="salary-top" />

      <section aria-labelledby="h-states" className="flex flex-col gap-5">
        <H2 id="h-states">Median pay in {m.statesLabel}</H2>
        <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
          <table className="w-full min-w-[640px] border-collapse text-body">
            <caption className="sr-only">{m.name} pay by state, highest median first</caption>
            <thead>
              <tr className="border-b-[1.5px] border-mist bg-panel text-left">
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">#</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">State</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Median</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">vs. U.S.</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Lowest 10%</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Top 10%</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((r) => (
                <tr key={r.abbr} className="border-t border-mist">
                  <td className="px-4 py-2.5 font-display font-bold text-muted">{r.rank}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/careers/${m.o.slug}/salary/${r.slug}`} className="font-bold text-ink">
                      {r.state}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-display font-semibold tabular">{money(r.median)}</td>
                  <td className={`px-4 py-2.5 font-bold tabular ${payChangeTone(r.vsNational)}`}>{signedPct(r.vsNational)}</td>
                  <td className="px-4 py-2.5 tabular">{np(r.p10)}</td>
                  <td className="px-4 py-2.5 tabular">{np(r.p90)}</td>
                  <td className="px-4 py-2.5 tabular">{r.employment == null ? "Not published" : r.employment.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-small text-muted">
          BLS OEWS May 2025 state estimates{m.group ? ` for the broader group “${w.bls_title}”` : ""}. States without
          published data are not listed. “Not published”: BLS withheld the value or it is above the highest amount BLS
          publishes. Pay is not adjusted for living costs.
        </p>
      </section>

      <FaqSection title={`${m.name} salary questions`} items={m.faq} />
      <RelatedLinks
        links={[
          { label: `${m.name} career profile`, href: `/careers/${m.o.slug}` },
          { label: `Jobs similar to ${m.nameLower}`, href: `/jobs-similar-to/${m.o.slug}` },
          { label: "Highest-paying jobs", href: "/careers/salary/high-paying" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Pay and employment: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025
        (national and state files).
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Occupation",
          name: m.o.title,
          url: `${SITE.url}/careers/${m.o.slug}/salary`,
          occupationalCategory: m.o.code,
          estimatedSalary: m.rows.map((r) => ({
            "@type": "MonetaryAmountDistribution",
            name: `${r.state} median`,
            currency: "USD",
            duration: "P1Y",
            median: r.median,
            ...(r.p10 != null ? { percentile10: r.p10 } : {}),
            ...(r.p90 != null ? { percentile90: r.p90 } : {}),
          })),
          occupationLocation: m.rows.map((r) => ({ "@type": "State", name: r.state })),
        }}
      />
    </div>
  );
}
