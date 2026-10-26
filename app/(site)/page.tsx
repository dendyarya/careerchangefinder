import Link from "next/link";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { JsonLd } from "@/components/page/Common";
import { careerCount, hubs, meta } from "@/lib/data";
import { occBySlug, transitionsFor } from "@/lib/data/server";
import { money, shortTitle, signedPct } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Career Change Finder: Free Career Change Tools",
  description: `Find your next career with the skills you already have. Compare ${careerCount} U.S. careers by skill match, BLS pay and training, or take the free career test.`,
  path: "/",
});

/** Example route from real data: elementary teachers -> best-matching job that pays more. */
function exampleRoute() {
  const src = occBySlug("elementary-school-teachers");
  const tr = transitionsFor("elementary-school-teachers");
  if (!src || !tr) return null;
  const to = tr.top.find((t) => !t.wage_is_group && (t.pay_change_pct ?? 0) > 0);
  if (!to) return null;
  const skills = tr.source_skills.slice(0, 3).map((s) => s.name);
  return { from: shortTitle(src.title), fromPay: tr.baseline_median, to, skills };
}

const PATHS = [
  {
    n: "01",
    title: "Change careers",
    text: "See jobs that use the skills from your current role, ranked by match, pay change and extra training.",
    cta: "Find my matches →",
    href: "/career-change/tool",
    dark: false,
  },
  {
    n: "02",
    title: "Take the Free Career Test",
    text: "60 interest questions from the O*NET Interest Profiler plus 13 questions about the workday you want.",
    cta: "Start the test →",
    href: "/career-test",
    dark: true,
  },
  {
    n: "03",
    title: "Choose a major",
    text: "Match college majors to your interests, and see the careers and pay each one leads to.",
    cta: "Take the major quiz →",
    href: "/college-major-quiz",
    dark: false,
  },
];

export default function Home() {
  const ex = exampleRoute();
  return (
    <>
      <section className="mx-auto flex max-w-[1312px] flex-wrap items-center gap-14 px-4 pt-12 pb-16 md:px-8 md:pt-[72px] md:pb-20">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <h1 className="m-0 text-h1 leading-[1.02] tracking-[-0.03em]">
            Find your next career with the{" "}
            <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,var(--color-sky)_58%)] px-1">
              skills you already have
            </span>
          </h1>
          <p className="m-0 max-w-[580px] text-lead text-muted">
            Tell us your current job. We match your skills to {careerCount} U.S. careers and show what each move pays
            and what you would need to learn.
          </p>
          <div className="max-w-[620px] rounded-lg border-[1.5px] border-mist bg-ice p-5 shadow-md md:p-6">
            <HomeJobPicker />
            <p className="mt-3 mb-0 text-small text-muted">Free · no sign-up · results in seconds</p>
          </div>
        </div>
        {ex && (
          <figure
            aria-label={`Example route from ${ex.from} to ${ex.to.title}`}
            className="m-0 flex min-w-0 flex-[1_1_440px] flex-col gap-5 rounded-lg border-[1.5px] border-mist bg-panel p-6 shadow-md md:p-[34px]"
          >
            <p className="m-0 text-small font-extrabold text-muted">Example route</p>
            <div className="flex items-center gap-3.5">
              <span
                className="h-[22px] w-[22px] shrink-0 rounded-full border-[3px] border-ink bg-white"
                aria-hidden="true"
              />
              <span className="font-display text-[22px] leading-tight font-bold">{ex.from}</span>
              <span className="ml-auto text-[17px] text-muted tabular">{money(ex.fromPay)}</span>
            </div>
            <div className="ml-[9px] flex flex-wrap gap-2 border-l-4 border-dotted border-accent py-1 pl-[30px]">
              {ex.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-sm border-[1.5px] border-mist bg-white px-3 py-0.5 text-[16px] font-bold"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <span
                className="h-[22px] w-[22px] shrink-0 rounded-full border-[3px] border-ink bg-accent"
                aria-hidden="true"
              />
              <Link
                href={`/careers/${ex.to.slug}`}
                className="font-display text-[22px] leading-tight font-bold text-ink"
              >
                {ex.to.title}
              </Link>
              <span className="ml-auto text-[17px] font-extrabold text-gain tabular">
                {money(ex.to.median)} · {signedPct(ex.to.pay_change_pct)}
              </span>
            </div>
            <figcaption className="text-small text-muted">
              {ex.to.match}% skill match. Pay: BLS OEWS May 2025 national medians.{" "}
              <Link href="/career-change/from-elementary-school-teachers">See all matches</Link>
            </figcaption>
          </figure>
        )}
      </section>

      <section aria-labelledby="start" className="mx-auto max-w-[1312px] px-4 pb-[88px] md:px-8">
        <h2 id="start" className="m-0 mb-7 text-h2 leading-[1.08] tracking-[-0.03em]">
          Where do you want to start?
        </h2>
        <div className="grid gap-7 md:grid-cols-3">
          {PATHS.map((p) => (
            <Link
              key={p.n}
              href={p.href}
              className={`flex flex-col gap-3 rounded-lg border-[1.5px] border-mist p-[30px] no-underline shadow-md ${p.dark ? "bg-primary text-white hover:bg-ink hover:text-white" : "bg-white text-ink hover:border-primary hover:text-ink"}`}
            >
              <span className={`font-display text-small font-bold ${p.dark ? "" : "text-primary"}`}>{p.n}</span>
              <span className="font-display text-[24px] font-bold">{p.title}</span>
              <span className={p.dark ? "" : "text-muted"}>{p.text}</span>
              <span className={`font-extrabold ${p.dark ? "" : "text-primary"}`}>{p.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="popular" className="border-y-[1.5px] border-mist bg-ice">
        <div className="mx-auto max-w-[1312px] px-4 py-16 md:px-8 md:py-[72px]">
          <h2 id="popular" className="m-0 mb-2.5 text-h2 leading-[1.08] tracking-[-0.03em]">
            Popular career changes
          </h2>
          <p className="m-0 mb-7 text-lead text-muted">Start from the job you have now.</p>
          <ul className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {hubs.map((h) => (
              <li key={h.slug}>
                <Link
                  href={`/career-change/from-${h.slug}`}
                  className="flex items-center justify-between rounded-[12px] border-[1.5px] border-mist bg-white px-5 py-[18px] font-bold text-ink no-underline hover:border-primary"
                >
                  Jobs for former {h.plural.toLowerCase()} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 mb-0">
            <Link href="/career-change/from" className="font-extrabold">
              See all careers →
            </Link>
          </p>
        </div>
      </section>

      <section aria-label="Why trust us" className="mx-auto max-w-[1312px] px-4 py-14 md:px-8">
        <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Data from O*NET 31.0",
              `U.S. Department of Labor career data, ${(meta.counts.occupations ?? 0).toLocaleString("en-US")} occupations`,
            ],
            ["Pay from BLS May 2025", "National and state wages for each career"],
            ["No sign-up", "Your answers stay in your browser"],
            ["Open methodology", "See exactly how every match is calculated"],
          ].map(([t, d]) => (
            <li key={t} className="flex items-start gap-3.5">
              <span aria-hidden="true" className="mt-2 h-3.5 w-3.5 shrink-0 rounded-full bg-accent" />
              <span>
                <strong>{t}</strong>
                <br />
                <span className="text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE.url}/#org`,
              name: SITE.name,
              url: SITE.url,
              email: "contact@careerchangefinder.com",
            },
            {
              "@type": "WebSite",
              "@id": `${SITE.url}/#website`,
              name: SITE.name,
              url: SITE.url,
              publisher: { "@id": `${SITE.url}/#org` },
              inLanguage: "en-US",
            },
          ],
        }}
      />
    </>
  );
}
