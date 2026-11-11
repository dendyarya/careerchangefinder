import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, H2, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { money, payChangeTone, per1000, signedPct } from "@/lib/format";
import { buildStateSalary } from "@/lib/salary";
import { pageMeta } from "@/lib/seo";
import { alsoCalled } from "@/lib/seoName";

// 874 careers × up to 51 states: rendered on first request, then cached (ISR). Unknown pairs 404.
export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; state: string }> }) {
  const { slug, state } = await params;
  const m = buildStateSalary(slug, state);
  if (!m) return {};
  return pageMeta({ title: m.title, description: m.description, path: `/careers/${slug}/salary/${state}`, noindex: m.noindex });
}

const np = (n: number | null) => (n == null ? "Not published" : money(n));
const pct = (v: number, base: number) => Math.round(((v - base) / base) * 100);

export default async function StateSalaryPage({ params }: { params: Promise<{ slug: string; state: string }> }) {
  const { slug, state } = await params;
  const m = buildStateSalary(slug, state);
  if (!m) notFound();
  const s = m.s;
  const w = m.o.wage!;
  const stats: [string, string][] = [
    ["Median pay", money(s.median)],
    ["Hourly median", s.hourly_median == null ? "Not published" : `$${s.hourly_median.toFixed(2)}`],
    ["vs. U.S. median", `${signedPct(s.vsNational)} (${money(m.nat)})`],
    [`vs. all jobs in ${s.abbr}`, m.total ? `${signedPct(m.vsStateAll)} (${money(m.total.median)})` : "Not available"],
    ["Pay rank among states", `${s.rank} of ${m.rows.length}`],
    ["Jobs in the state", s.employment == null ? "Not published" : s.employment.toLocaleString("en-US")],
  ];
  const spread: [string, number | null][] = [
    ["Lowest 10%", s.p10],
    ["25th percentile", s.p25],
    ["Median", s.median],
    ["75th percentile", s.p75],
    ["Top 10%", s.p90],
  ];
  const max = Math.max(...spread.map(([, v]) => v ?? 0), w.p90 ?? 0, 1);
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs
        items={[
          { name: "Careers", href: "/careers" },
          { name: m.name, href: `/careers/${slug}` },
          { name: "Salary by state", href: `/careers/${slug}/salary` },
          { name: s.state },
        ]}
      />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before={`${m.name} Salary in `} highlight={s.state} />
        {alsoCalled(m.o.title, m.o.code) && <p className="m-0 text-small text-muted">Also called: {alsoCalled(m.o.title, m.o.code)}</p>}
        <p className="m-0 text-lead">
          {m.name} in {s.state} earn a median of {money(s.median)} a year, {signedPct(s.vsNational)} compared with
          the U.S. median.{m.group ? ` Figures are for the broader BLS group “${w.bls_title}”.` : ""}
        </p>
        {m.summary.length > 0 && <p className="m-0">{m.summary.join(" ")}</p>}
        <UpdatedLine sources="BLS OEWS May 2025" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[26px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="h-range" className="flex max-w-[920px] flex-col gap-4">
        <H2 id="h-range">Pay range in {s.state}</H2>
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
        <p className="m-0">
          The middle half of {m.nameLower} in {s.state} earn between <strong>{np(s.p25)}</strong> and{" "}
          <strong>{np(s.p75)}</strong>. Nationally the full range is {np(w.p10)} to {np(w.p90)}.
        </p>
      </section>

      <AdSlot size="leaderboard" id="state-top" />

      {s.jobs_per_1000 != null && (
        <section aria-labelledby="h-common" className="flex max-w-[920px] flex-col gap-3">
          <H2 id="h-common">How common the job is in {s.state}</H2>
          <p className="m-0">
            {s.state} has {s.employment == null ? "an unpublished number of" : `about ${s.employment.toLocaleString("en-US")}`}{" "}
            jobs for {m.nameLower}, or <strong>{per1000(s.jobs_per_1000)} of every 1,000 jobs</strong> in the state.
            {m.concWord ? ` That makes the job ${m.concWord} in the U.S. as a whole` : ""}
            {s.lq != null ? ` (location quotient ${s.lq.toFixed(2)}, where 1.00 is the U.S. average)` : ""}.
            {m.concRank ? ` It ranks ${m.concRank} of ${m.concCount} states by how common the job is.` : ""}
          </p>
          {s.emp_rse != null && s.emp_rse > 15 && (
            <p className="m-0 text-small text-muted">
              BLS rates this job count as less precise (relative standard error {s.emp_rse}%), so treat it as a rough
              figure.
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="h-near" className="flex flex-col gap-4">
        <H2 id="h-near">{m.borders.length ? `Pay in states bordering ${s.state}` : `States ranked near ${s.state}`}</H2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {(m.borders.length ? m.borders : m.neighbors).map((r) => (
            <li key={r.abbr}>
              <Link href={`/careers/${slug}/salary/${r.slug}`} className="flex h-full flex-col gap-1 rounded-[12px] border-[1.5px] border-mist px-5 py-4 text-ink no-underline hover:border-primary">
                <span className="font-bold">{r.state}</span>
                <span className="text-small text-muted">
                  {money(r.median)}{" "}
                  <strong className={payChangeTone(pct(r.median, s.median))}>({signedPct(pct(r.median, s.median))} vs. {s.abbr})</strong>
                  {" · "}rank {r.rank}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="m-0">
          <Link href={`/careers/${slug}/salary`} className="font-extrabold">
            All {m.rows.length} states →
          </Link>
        </p>
      </section>

      {m.better.length > 0 ? (
        <section aria-labelledby="h-better" className="flex flex-col gap-4">
          <H2 id="h-better">Close careers that pay more in {s.state}</H2>
          <p className="m-0 max-w-[920px]">
            Among the 25 careers closest to {m.nameLower} in skills and daily work, these pay at least 10% more in{" "}
            {s.state}, usually need no more preparation, and are not manager or supervisor roles. Same rules as our{" "}
            <Link href="/research/better-paying-careers">better-paying careers study</Link>.
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {m.better.map((x) => (
              <li key={x.slug}>
                <Link href={`/careers/${x.slug}/salary/${s.slug}`} className="flex h-full flex-col gap-1 rounded-[12px] border-[1.5px] border-mist px-5 py-4 text-ink no-underline hover:border-primary">
                  <span className="font-bold">{x.title}</span>
                  <span className="text-small text-muted">
                    {money(x.median)} in {s.state} <strong className="text-gain">{`(+${x.raise}%)`}</strong> · match {x.match}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        m.similar.length > 0 && (
          <section aria-labelledby="h-sim" className="flex flex-col gap-4">
            <H2 id="h-sim">Similar jobs in {s.state}</H2>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {m.similar.map((x) => (
                <li key={x.slug}>
                  <Link href={`/careers/${x.slug}`} className="flex h-full flex-col gap-1 rounded-[12px] border-[1.5px] border-mist px-5 py-4 text-ink no-underline hover:border-primary">
                    <span className="font-bold">{x.title}</span>
                    <span className="text-small text-muted">
                      {money(x.median)} median in {s.state}
                      {x.group ? " (broader BLS group)" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      )}

      <FaqSection title={`${m.name} pay in ${s.state}`} items={m.faq} />
      <RelatedLinks
        links={[
          { label: `${m.name} career profile`, href: `/careers/${slug}` },
          { label: `Jobs similar to ${m.nameLower}`, href: `/jobs-similar-to/${slug}` },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Pay and employment: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025
        (national and state files, including jobs per 1,000 and location quotients). “All jobs in the state” is the
        BLS all-occupations median for {s.state}. Pay is not adjusted for living costs.
      </SourcesBox>
    </div>
  );
}
