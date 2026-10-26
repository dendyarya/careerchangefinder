import Link from "next/link";
import { Breadcrumbs, PageTitle, SourcesBox } from "@/components/page/Common";
import { pageMeta } from "@/lib/seo";
import { TRAITS } from "@/lib/traits";

export const metadata = pageMeta({
  title: "The Big Five Personality Traits Explained",
  description:
    "What each Big Five trait means at the high and low end, with typical strengths and careers that fit. Based on public-domain IPIP items and O*NET data.",
  path: "/tests/results/big-five",
});

export default function BigFiveExplained() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Tests", href: "/tests" }, { name: "Big Five Traits Explained" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="The Big Five traits, " highlight="explained" />
        <p className="m-0 text-lead">
          Five broad traits describe most differences in personality. Each one is a scale, and a middle score is the
          most common. Pick a trait to see what each end means and which careers fit.
        </p>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        {TRAITS.map((t) => (
          <section
            key={t.id}
            id={t.id}
            aria-labelledby={`h-${t.id}`}
            className="flex scroll-mt-6 flex-col gap-3 rounded-lg border-[1.5px] border-mist p-6"
          >
            <h2 id={`h-${t.id}`} className="m-0 font-display text-[26px] font-bold">
              {t.name}
            </h2>
            <p className="m-0 text-slate">
              {t.about} A middle score means you show both sides depending on the situation.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href={`/tests/results/high-${t.id}`}
                className="rounded-full bg-primary px-4 py-2 font-bold text-white no-underline hover:bg-ink hover:text-white"
              >
                {t.high.label} →
              </Link>
              <Link
                href={`/tests/results/low-${t.id}`}
                className="rounded-full border-[1.5px] border-mist px-4 py-2 font-bold text-ink no-underline hover:border-primary"
              >
                {t.low.label} →
              </Link>
            </div>
          </section>
        ))}
      </div>
      <p className="m-0">
        <Link href="/big-five-personality-test" className="font-extrabold">
          Take the free Big Five Personality Test →
        </Link>
      </p>
      <SourcesBox>
        Based on the IPIP Big-Five Factor Markers (public domain) and O*NET 31.0 Work Styles (CC BY 4.0).
      </SourcesBox>
    </div>
  );
}
