import Link from "next/link";
import { Breadcrumbs, PageTitle, SourcesBox } from "@/components/page/Common";
import { buildListing } from "@/lib/listings";
import { AREA_TEXT } from "@/lib/riasecText";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Holland Codes Explained: The 6 RIASEC Areas",
  description:
    "What Realistic, Investigative, Artistic, Social, Enterprising and Conventional mean, how a 3-letter Holland code works, and careers in each area (O*NET 31.0).",
  path: "/tests/results/holland-codes",
});

export default function HollandExplained() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Tests", href: "/tests" }, { name: "Holland Codes Explained" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Holland codes, " highlight="explained" />
        <p className="m-0 text-lead">
          Holland’s model sorts work interests into six areas, known as RIASEC. Your Holland code is your top two or
          three areas, strongest first. O*NET gives every career the same kind of code, so you can compare the two.
        </p>
        <p className="m-0">
          <Link href="/career-test" className="font-extrabold">
            Find your Holland code with the Free Career Test →
          </Link>
        </p>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        {Object.entries(AREA_TEXT).map(([letter, a]) => {
          const l = buildListing("holland-code", a.name.toLowerCase())!;
          return (
            <section key={letter} id={a.name.toLowerCase()} aria-labelledby={`h-${letter}`} className="flex scroll-mt-6 flex-col gap-3 rounded-lg border-[1.5px] border-mist p-6">
              <h2 id={`h-${letter}`} className="m-0 font-display text-[26px] font-bold">
                {letter} · {a.name}
              </h2>
              <p className="m-0 text-slate">
                People with strong {a.name} interests like {a.text}. {l.rows.length} careers have {a.name} as their
                strongest area.
              </p>
              <p className="m-0 text-small font-bold text-muted">Strongest {a.name} careers</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {l.rows.slice(0, 5).map((r) => (
                  <li key={r.slug}>
                    <Link href={`/careers/${r.slug}`} className="block rounded-[10px] border-[1.5px] border-mist px-3 py-1.5 text-[16px] font-bold text-ink no-underline hover:border-primary">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/careers/holland-code/${a.name.toLowerCase()}`} className="font-extrabold">
                All {l.rows.length} {a.name} careers →
              </Link>
            </section>
          );
        })}
      </div>
      <SourcesBox>
        Interest areas: Holland’s RIASEC model as used in O*NET. Career interest scores: O*NET 31.0 Interests (CC BY
        4.0), USDOL/ETA.
      </SourcesBox>
    </div>
  );
}
