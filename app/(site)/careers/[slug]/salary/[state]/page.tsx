import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, H2, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { money, payChangeTone, signedPct } from "@/lib/format";
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

export default async function StateSalaryPage({ params }: { params: Promise<{ slug: string; state: string }> }) {
  const { slug, state } = await params;
  const m = buildStateSalary(slug, state);
  if (!m) notFound();
  const s = m.s;
  const w = m.o.wage!;
  const stats: [string, string][] = [
    ["Median pay", money(s.median)],
    ["vs. U.S. median", `${signedPct(s.vsNational)} (${money(m.nat)})`],
    ["Rank among states", `${s.rank} of ${m.rows.length}`],
    ["Jobs in the state", s.employment == null ? "Not published" : s.employment.toLocaleString("en-US")],
  ];
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
        <UpdatedLine sources="BLS OEWS May 2025" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[26px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="h-range" className="flex max-w-[920px] flex-col gap-3">
        <H2 id="h-range">Pay range in {s.state}</H2>
        <p className="m-0">
          The lowest-paid 10% earn under <strong>{np(s.p10)}</strong>; the top 10% earn over{" "}
          <strong>{np(s.p90)}</strong>. Nationally the range is {np(w.p10)} to {np(w.p90)}.
        </p>
      </section>

      <AdSlot size="leaderboard" id="state-top" />

      <section aria-labelledby="h-near" className="flex flex-col gap-4">
        <H2 id="h-near">States ranked near {s.state}</H2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {m.neighbors.map((r) => (
            <li key={r.abbr}>
              <Link href={`/careers/${slug}/salary/${r.slug}`} className="flex h-full flex-col gap-1 rounded-[12px] border-[1.5px] border-mist px-5 py-4 text-ink no-underline hover:border-primary">
                <span className="font-bold">
                  {r.rank}. {r.state}
                </span>
                <span className="text-small text-muted">
                  {money(r.median)} <strong className={payChangeTone(r.vsNational)}>({signedPct(r.vsNational)})</strong>
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

      {m.similar.length > 0 && (
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
        (national and state files). Pay is not adjusted for living costs.
      </SourcesBox>
    </div>
  );
}
