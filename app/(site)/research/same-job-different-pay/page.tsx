import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox } from "@/components/page/Common";
import { money } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { type CareerGap, millions, pct1, sameJobStudy, STUDIES } from "@/lib/studies";

const PATH = "/research/same-job-different-pay";
const INFO = STUDIES.find((x) => x.slug === "same-job-different-pay")!;
const CSV_STATES = "/research/same-job-different-pay-states.csv";
const CSV_CAREERS = "/research/same-job-different-pay-careers.csv";

const pct0 = (x: number) => `${Math.round(x * 100)}%`;
const the = (state: string) => (state === "District of Columbia" ? "the District of Columbia" : state);
const listAnd = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const signed = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x * 100).toFixed(1)}%`;

function copy() {
  const s = sameJobStudy();
  const n = s.national;
  return {
    s,
    n,
    title: INFO.title,
    description: `For the same job, the best-paying U.S. state pays a median of ${pct0(n.median_gap)} more than the lowest-paying one. State pay index and ${n.careers} careers, from BLS May 2025 data.`,
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

function GapTable({ rows, caption }: { rows: CareerGap[]; caption: string }) {
  return (
    <div className="article-body max-w-none">
      <table tabIndex={0}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Career</th>
            <th scope="col">U.S. median</th>
            <th scope="col">Highest-paying state</th>
            <th scope="col">Lowest-paying state</th>
            <th scope="col">Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.slug}>
              <th scope="row">
                <Link href={`/careers/${c.slug}/salary`}>{c.title}</Link>
              </th>
              <td className="tabular">{money(c.median)}</td>
              <td className="tabular">
                {c.high.state} {money(c.high.median)}
              </td>
              <td className="tabular">
                {c.low.state} {money(c.low.median)}
              </td>
              <td className="tabular font-bold">+{pct0(c.gap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  const { s, n, title, description } = copy();
  const top = s.states[0]!;
  const second = s.states[1]!;
  const bottom = s.states[s.states.length - 1]!;
  const maxAbs = Math.max(...s.states.map((r) => Math.abs(r.index)));
  const mostTop = [...s.states].sort((a, b) => b.top_in - a.top_in || a.state.localeCompare(b.state)).slice(0, 3);
  const nurses = s.largest.find((c) => c.slug === "registered-nurses");
  const quote = `Across ${n.careers} U.S. careers with reliable BLS pay figures in at least ${s.rules.min_states} states, the highest-paying state pays a median of ${pct1(n.median_gap)} more than the lowest-paying state for the same job. In ${n.careers_double} careers (${pct1(n.share_double)}), the top state pays at least double. For the same jobs, pay runs ${signed(top.index)} against the national median in ${the(top.state)} and ${signed(bottom.index)} in ${the(bottom.state)}.`;

  const faqs = [
    {
      q: "Does a higher-paying state mean I will be better off?",
      a: "Not always. These figures are not adjusted for cost of living. In 2024, prices ran from 10.7% above the U.S. average in California to 13.1% below it in Arkansas, according to the Bureau of Economic Analysis. A gap of 15% to 20% can disappear after rent and other costs.",
    },
    {
      q: "What is the same-job pay index?",
      a: "For each state, we divide the state median pay of every career by that career's national median, then take the middle value, weighted by how many people in the state work in each career. Because it compares each job with itself, the mix of jobs in a state does not change the index.",
    },
    {
      q: "Why are some careers left out?",
      a: `A career needs its own national BLS pay figure and reliable figures in at least ${s.rules.min_states} states to appear in the gap rankings. A state figure counts only when BLS estimates at least ${s.rules.min_employment} jobs with a relative standard error of ${s.rules.max_rse}% or less. Thin or unreliable figures could exaggerate the gaps.`,
    },
    {
      q: "Can I use these numbers in an article or report?",
      a: `Yes. Please cite "${SITE.name}, ${title}" and link to this page. Both tables can be downloaded as CSV files below, and the method is described on this page.`,
    },
  ];

  return (
    <>
      <section className="border-b-[1.5px] border-mist bg-ice">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pt-8 pb-10 md:px-8">
          <Breadcrumbs items={[{ name: "Research", href: "/research" }, { name: "Same job, different pay" }]} />
          <PageTitle before="Same job, " highlight="different pay" after=": how your state changes your salary" />
          <p className="m-0 max-w-[760px] text-[20px] text-slate">
            We compared the pay for the same job across U.S. states. For the typical career, the best-paying state pays{" "}
            {pct0(n.median_gap)} more than the lowest-paying one.
          </p>
          <p className="m-0 text-small text-muted">
            Published November 11, 2026 · Data: BLS OEWS May 2025 (national and state) · By the {SITE.name} team
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-14 px-4 pt-10 pb-20 md:px-8">
        <section aria-labelledby="key-findings" className="flex flex-col gap-5">
          <H2 id="key-findings">Key findings</H2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value={`+${pct0(n.median_gap)}`} label={`typical gap between the highest- and lowest-paying state for the same job (median of ${n.careers} careers)`} />
            <Stat value={pct1(n.share_double)} label={`of careers (${n.careers_double}) pay at least twice as much in the top state as in the bottom state`} />
            <Stat value={signed(top.index)} label={`same-job pay in ${the(top.state)}, the highest of any state`} />
            <Stat value={signed(bottom.index)} label={`same-job pay in ${the(bottom.state)}, the lowest of any state`} />
          </div>
          <ul className="m-0 flex max-w-[860px] flex-col gap-2 pl-5 text-[18px]">
            <li>
              Location matters for almost every job: in {n.careers_50} of {n.careers} careers ({pct1(n.share_50)}), the top
              state pays at least 50% more than the bottom state.
            </li>
            <li>
              Careers where the top state pays at least double employ {millions(n.workers_double)} people,{" "}
              {pct1(n.share_workers_double)} of the {millions(n.workers)} workers covered.
            </li>
            <li>
              Comparing each job only with itself, the same work pays {signed(top.index)} against the national median in{" "}
              {the(top.state)} and {signed(second.index)} in {the(second.state)}, but {signed(bottom.index)} in{" "}
              {the(bottom.state)}.
            </li>
            <li>
              The places that pay the most for the largest number of careers are{" "}
              {listAnd(mostTop.map((r) => `${the(r.state)} (${r.top_in})`))}.
            </li>
            {nurses && (
              <li>
                Registered nurses, one of the largest careers, earn a median of {money(nurses.high.median)} in{" "}
                {the(nurses.high.state)} and {money(nurses.low.median)} in {the(nurses.low.state)}, a gap of {pct0(nurses.gap)}.
              </li>
            )}
          </ul>
        </section>

        <section aria-labelledby="by-state" className="flex flex-col gap-4">
          <H2 id="by-state">Same-job pay index by state</H2>
          <p className="m-0 max-w-[860px] text-slate">
            How much more or less the same jobs pay in each state than their national median (weighted median across every
            career with a reliable state figure). &quot;Pays most&quot; counts the careers, among the {n.careers} in the gap
            rankings, where the state has the highest median. Not adjusted for cost of living.
          </p>
          <div className="article-body max-w-none">
            <table tabIndex={0}>
              <caption className="sr-only">Same-job pay index for {s.states.length} states including the District of Columbia</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">State</th>
                  <th scope="col">Same-job pay vs. U.S.</th>
                  <th scope="col">Careers above U.S. median</th>
                  <th scope="col">Pays most</th>
                </tr>
              </thead>
              <tbody>
                {s.states.map((r, i) => (
                  <tr key={r.abbr}>
                    <td className="tabular">{i + 1}</td>
                    <th scope="row">{r.state}</th>
                    <td>
                      <div className="flex min-w-[200px] items-center gap-3">
                        <span className={`w-[64px] font-bold tabular ${r.index >= 0.03 ? "text-gain" : r.index <= -0.03 ? "text-loss" : ""}`}>
                          {signed(r.index)}
                        </span>
                        <span className="relative h-3 flex-1 overflow-hidden rounded-[7px] bg-mist" aria-hidden="true">
                          <span
                            className={`absolute top-0 h-full ${r.index >= 0 ? "left-1/2 bg-primary" : "right-1/2 bg-field-border"}`}
                            style={{ width: `${(Math.abs(r.index) / maxAbs) * 50}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="tabular">
                      {pct1(r.share_above)} of {r.careers}
                    </td>
                    <td className="tabular">{r.top_in}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[16px]">
            <a href={CSV_STATES} download className="font-extrabold">
              Download the state table (CSV)
            </a>
          </p>
        </section>

        <AdSlot size="leaderboard" id="study-mid" />

        <section aria-labelledby="big-jobs" className="flex flex-col gap-4">
          <H2 id="big-jobs">The 12 largest U.S. jobs: best- and worst-paying state</H2>
          <p className="m-0 max-w-[860px] text-slate">
            State median pay for the same job, BLS May 2025. Click a career for its pay in every state.
          </p>
          <GapTable rows={s.largest} caption="Highest and lowest state median pay for the 12 largest U.S. jobs" />
        </section>

        <section aria-labelledby="widest" className="flex flex-col gap-4">
          <H2 id="widest">The 12 careers where location matters most</H2>
          <p className="m-0 max-w-[860px] text-slate">
            Careers with the widest gap between the highest- and lowest-paying state. Tipped jobs, part-time-heavy jobs and
            public jobs set by state or local budgets stand out.
          </p>
          <GapTable rows={s.widest} caption="Careers with the widest state pay gap" />
          <p className="m-0 max-w-[860px] text-slate">
            At the other end, pay barely changes for {s.narrowest.slice(0, 2).map((c) => c.title.toLowerCase()).join(" and ")}{" "}
            (gaps of {pct0(s.narrowest[0]!.gap)} and {pct0(s.narrowest[1]!.gap)}), whose pay is set by national contracts.
          </p>
          <p className="m-0 text-[16px]">
            <a href={CSV_CAREERS} download className="font-extrabold">
              Download all {n.careers} careers (CSV)
            </a>
          </p>
        </section>

        <section aria-labelledby="method" className="article-body max-w-[860px]">
          <h2 id="method">How we did it</h2>
          <p>
            We used the national and state pay figures in the BLS Occupational Employment and Wage Statistics (May 2025)
            for every career that has its own national median (careers that only have a figure for a broader group, and
            top-coded figures, were left out). A state figure was used only when BLS publishes a median and estimates at
            least {s.rules.min_employment} jobs with a relative standard error of {s.rules.max_rse}% or less.
          </p>
          <ul>
            <li>
              <strong>Gap:</strong> for each career with reliable figures in at least {s.rules.min_states} states (
              {n.careers} careers, {millions(n.workers)} workers), the highest state median divided by the lowest, minus 1.
            </li>
            <li>
              <strong>Same-job pay index:</strong> for each state, every career&apos;s state median divided by its national
              median, minus 1. We report the median of these values weighted by the career&apos;s employment in the state.
            </li>
          </ul>
          <p>
            The 50 states and the District of Columbia are included. Every figure on this page, and both CSV files, are
            recalculated by a separate script before the site is published.
          </p>
          <h3>Limits</h3>
          <ul>
            <li>
              Pay is not adjusted for cost of living. See the{" "}
              <a href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area">
                BEA Regional Price Parities
              </a>{" "}
              for price levels by state.
            </li>
            <li>Medians describe careers, not people. Experience, employer and city matter as much as the state.</li>
            <li>
              BLS annual pay for part-time-heavy and tipped jobs reflects hourly pay times a full-time year, and tip rules
              differ by state.
            </li>
            <li>Some physician and judicial figures rest on few workers and vary more from year to year.</li>
          </ul>
        </section>

        <section aria-labelledby="cite" className="flex max-w-[860px] flex-col gap-3">
          <H2 id="cite">Quote this study</H2>
          <blockquote className="m-0 rounded-[20px] border-l-4 border-accent bg-ice px-6 py-5 text-[18px]">{quote}</blockquote>
          <p className="m-0 text-[16px] text-slate">
            Source: {SITE.name}, &quot;{title}&quot; (November 2026), {SITE.url}
            {PATH}. Based on BLS OEWS May 2025.
          </p>
        </section>

        <FaqSection title="Questions about this study" items={faqs} />

        <RelatedLinks
          links={[
            { label: "Research: better-paying careers", href: "/research/better-paying-careers" },
            { label: "Change careers without a pay cut", href: "/guides/how-to-change-careers-without-a-pay-cut" },
            { label: "Career change tool", href: "/career-change/tool" },
            { label: "Methodology", href: "/methodology" },
          ]}
          cta={{ label: "Take the free career test", href: "/career-test" }}
        />

        <SourcesBox>
          Pay and employment: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May 2025
          (national and state). Price levels: U.S. Bureau of Economic Analysis, Regional Price Parities by State, 2024
          (released February 19, 2026). Calculations by {SITE.name}.
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
          isBasedOn: ["https://www.bls.gov/oes/"],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `${title}: state pay index and career pay gaps`,
          description,
          url: `${SITE.url}${PATH}`,
          creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
          spatialCoverage: "United States",
          temporalCoverage: "2025-05",
          variableMeasured: ["Same-job pay index by state", "Gap between highest and lowest state median pay"],
          distribution: [
            { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE.url}${CSV_STATES}` },
            { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE.url}${CSV_CAREERS}` },
          ],
        }}
      />
    </>
  );
}
