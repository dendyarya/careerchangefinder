import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox } from "@/components/page/Common";
import { careerChangeSources } from "@/lib/data/server";
import { money } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { betterPayStudy, millions, pct1, STUDIES } from "@/lib/studies";

const PATH = "/research/better-paying-careers";
const INFO = STUDIES[0];

function copy() {
  const s = betterPayStudy();
  const n = s.national;
  return {
    s,
    n,
    title: INFO.title,
    description: `${pct1(n.share_jobs)} of ${n.jobs} U.S. careers have a close match that pays at least 10% more with no extra training. State-by-state results from BLS and O*NET data.`,
  };
}

export function generateMetadata() {
  const { title, description } = copy();
  return pageMeta({ title, description, path: PATH });
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] border-[1.5px] border-mist bg-panel px-5 py-4">
      <span className="font-display text-[34px] leading-none font-bold tabular">{value}</span>
      <span className="text-[16px] text-slate">{label}</span>
    </div>
  );
}

export default function Page() {
  const { s, n, title, description } = copy();
  const from = new Set(careerChangeSources());
  const first = s.states[0]!;
  const last = s.states[s.states.length - 1]!;
  const max = first.share_workers;
  const raisePct = Math.round(s.rules.raise_min * 100);
  const quote = `Of the ${n.jobs} U.S. careers with their own BLS pay figure, ${n.jobs_with_move} (${pct1(n.share_jobs)}) have at least one close match among their ${s.rules.top_n} most similar careers that pays at least ${raisePct}% more at the median, usually needs no more preparation, and is not a manager or supervisor role. Those careers employ ${pct1(n.share_workers)} of the workers covered.`;

  const faqs = [
    {
      q: "Does this mean I will earn at least 10% more if I switch?",
      a: "No. The study compares median pay, the middle of each career's pay range. Your own pay depends on your experience, employer, location and how the new job is set up. Treat a match as a lead worth checking, not a promise.",
    },
    {
      q: "What does \"no extra preparation\" mean here?",
      a: "The better-paying career has an O*NET Job Zone no higher than your current career's. Job Zones group careers by the education, training and experience they usually need. Some careers still need a license or certificate, so always check the requirements on the career profile.",
    },
    {
      q: "Why are managers and supervisors left out?",
      a: "Manager and supervisor jobs usually pay more, but people tend to reach them through promotion inside a field rather than by changing careers. Leaving them out keeps the study about moves you can apply for.",
    },
    {
      q: "Can I use these numbers in an article or report?",
      a: `Yes. Please cite \"${SITE.name}, ${title}\" and link to this page. The figures are calculated from public U.S. government data, and the method is described on this page.`,
    },
  ];

  return (
    <>
      <section className="border-b-[1.5px] border-mist bg-ice">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pt-8 pb-10 md:px-8">
          <Breadcrumbs items={[{ name: "Research" }, { name: "Better-paying careers" }]} />
          <PageTitle before="Nearly 9 in 10 U.S. careers have a " highlight="better-paying move" after=" within reach" />
          <p className="m-0 max-w-[760px] text-[20px] text-slate">
            We checked every U.S. career with its own BLS pay figure for a close match that pays at least {raisePct}% more
            and usually needs no extra schooling. {pct1(n.share_jobs)} of careers have one.
          </p>
          <p className="m-0 text-small text-muted">
            Published October 28, 2026 · Data: O*NET 31.0 and BLS OEWS May 2025 · By the {SITE.name} team
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-14 px-4 pt-10 pb-20 md:px-8">
        <section aria-labelledby="key-findings" className="flex flex-col gap-5">
          <H2 id="key-findings">Key findings</H2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value={pct1(n.share_jobs)} label={`of ${n.jobs} careers (${n.jobs_with_move}) have a better-paying close match`} />
            <Stat value={pct1(n.share_workers)} label={`of workers (${millions(n.workers_with_move)} of ${millions(n.workers)}) are in those careers`} />
            <Stat value={pct1(n.median_closest_raise)} label="typical pay gap to the closest qualifying match (median)" />
            <Stat value={pct1(first.share_workers)} label={`of workers in ${first.state}, the highest share of any state`} />
          </div>
          <ul className="m-0 flex max-w-[860px] flex-col gap-2 pl-5 text-[18px]">
            <li>
              For most careers, a better-paying option sits among the {s.rules.top_n} closest matches: careers that use
              similar skills, knowledge and daily work activities.
            </li>
            <li>
              When such a match exists, the closest one pays a median of {pct1(n.median_closest_raise)} more.
            </li>
            <li>
              Results differ by state, from {pct1(first.share_workers)} of workers in {first.state} to{" "}
              {pct1(last.share_workers)} in {last.state}, because pay gaps between careers differ from place to place.
            </li>
          </ul>
        </section>

        <section aria-labelledby="big-jobs" className="flex flex-col gap-4">
          <H2 id="big-jobs">The 12 largest U.S. jobs and their closest better-paying match</H2>
          <p className="m-0 max-w-[860px] text-slate">
            The closest qualifying match is the one with the highest match score. National median pay, BLS May 2025.
          </p>
          <div className="article-body max-w-none">
            <table tabIndex={0}>
              <thead>
                <tr>
                  <th scope="col">Current job</th>
                  <th scope="col">Workers</th>
                  <th scope="col">Median pay</th>
                  <th scope="col">Closest better-paying match</th>
                  <th scope="col">Match</th>
                  <th scope="col">Its median pay</th>
                  <th scope="col">Difference</th>
                </tr>
              </thead>
              <tbody>
                {s.examples.map((e) => (
                  <tr key={e.slug}>
                    <th scope="row">
                      <Link href={from.has(e.slug) ? `/career-change/from-${e.slug}` : `/careers/${e.slug}`}>{e.title}</Link>
                    </th>
                    <td className="tabular">{e.employment.toLocaleString("en-US")}</td>
                    <td className="tabular">{money(e.median)}</td>
                    {e.to ? (
                      <>
                        <td>
                          <Link href={`/careers/${e.to.slug}`}>{e.to.title}</Link>
                        </td>
                        <td className="tabular">{e.to.match}</td>
                        <td className="tabular">{money(e.to.median)}</td>
                        <td className="tabular font-bold text-gain">+{pct1(e.to.raise)}</td>
                      </>
                    ) : (
                      <td colSpan={4}>None that meets all the rules</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AdSlot size="leaderboard" id="study-mid" />

        <section aria-labelledby="by-state" className="flex flex-col gap-4">
          <H2 id="by-state">Results by state</H2>
          <p className="m-0 max-w-[860px] text-slate">
            The same test run with each state&apos;s own BLS pay figures: a match counts only if it pays at least{" "}
            {raisePct}% more in that state. States are sorted by the share of workers in careers that have a
            better-paying close match. Only states with pay data for at least 200 careers are included ({s.states.length}{" "}
            including the District of Columbia).
          </p>
          <div className="article-body max-w-none">
            <table tabIndex={0}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">State</th>
                  <th scope="col">Share of workers</th>
                  <th scope="col">Careers with a match</th>
                  <th scope="col">Typical gap</th>
                </tr>
              </thead>
              <tbody>
                {s.states.map((r, i) => (
                  <tr key={r.abbr}>
                    <td className="tabular">{i + 1}</td>
                    <th scope="row">{r.state}</th>
                    <td>
                      <div className="flex min-w-[180px] items-center gap-3">
                        <span className="w-[56px] font-bold tabular">{pct1(r.share_workers)}</span>
                        <span className="h-3 flex-1 overflow-hidden rounded-[7px] bg-mist" aria-hidden="true">
                          <span
                            className="block h-full rounded-[7px] bg-primary"
                            style={{ width: `${(r.share_workers / max) * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="tabular">
                      {r.jobs_with_move} of {r.jobs} ({pct1(r.share_jobs)})
                    </td>
                    <td className="tabular">+{pct1(r.median_closest_raise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="method" className="article-body max-w-[860px]">
          <h2 id="method">How we did it</h2>
          <p>
            We started with the {n.jobs} careers that have their own pay figure in the BLS Occupational Employment and
            Wage Statistics (May 2025). Careers that only have a pay figure for a broader group were left out. For each
            one we took its {s.rules.top_n} closest matches from our <Link href="/methodology">career-change model</Link>,
            which compares O*NET skills, knowledge, work activities and interests. A match counted as a better-paying
            move only if all of these were true:
          </p>
          <ul>
            <li>it has its own BLS median pay figure in the same area (the nation or the state);</li>
            <li>its median pay is at least {raisePct}% higher than the current career&apos;s;</li>
            <li>its O*NET Job Zone (usual education, training and experience) is not higher;</li>
            <li>it is not a manager role (SOC major group 11) and has no &quot;supervisor&quot; in its title.</li>
          </ul>
          <p>
            &quot;Share of workers&quot; weights each career by its BLS employment. The typical gap is the median, across
            careers that have a qualifying match, of the pay difference to the closest one. Every figure on this page is
            recalculated by a separate script before the site is published.
          </p>
          <h3>Limits</h3>
          <ul>
            <li>Medians describe careers, not people. Pay for a new hire is often below the median.</li>
            <li>A close match shares skills and work activities, but employers may still ask for experience in the field.</li>
            <li>A Job Zone shows typical preparation; some careers also need a license or certificate.</li>
            <li>BLS does not publish pay for every career in every state, so state results cover fewer careers.</li>
          </ul>
        </section>

        <section aria-labelledby="cite" className="flex max-w-[860px] flex-col gap-3">
          <H2 id="cite">Quote this study</H2>
          <blockquote className="m-0 rounded-[20px] border-l-4 border-accent bg-ice px-6 py-5 text-[18px]">
            {quote}
          </blockquote>
          <p className="m-0 text-[16px] text-slate">
            Source: {SITE.name}, &quot;{title}&quot; (October 2026), {SITE.url}
            {PATH}. Based on O*NET 31.0 and BLS OEWS May 2025.
          </p>
        </section>

        <FaqSection title="Questions about this study" items={faqs} />

        <RelatedLinks
          links={[
            { label: "Career change tool", href: "/career-change/tool" },
            { label: "Best careers to switch to", href: "/guides/best-careers-to-switch-to" },
            { label: "How to change careers", href: "/guides/how-to-change-careers" },
            { label: "Methodology", href: "/methodology" },
          ]}
          cta={{ label: "Take the free career test", href: "/career-test" }}
        />

        <SourcesBox>
          Skills, work activities and Job Zones: O*NET 31.0 Database, U.S. Department of Labor, Employment and Training
          Administration (USDOL/ETA), used under CC BY 4.0. Pay and employment: U.S. Bureau of Labor Statistics,
          Occupational Employment and Wage Statistics, May 2025 (national and state). Calculations by {SITE.name}.
        </SourcesBox>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          datePublished: INFO.published,
          url: `${SITE.url}${PATH}`,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          isBasedOn: [
            "https://www.onetcenter.org/database.html",
            "https://www.bls.gov/oes/",
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `${title}: results by state`,
          description,
          url: `${SITE.url}${PATH}`,
          creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
          spatialCoverage: "United States",
          temporalCoverage: "2025-05",
          variableMeasured: ["Share of workers in careers with a better-paying close match", "Median pay difference"],
        }}
      />
    </>
  );
}
