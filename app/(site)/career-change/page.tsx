import Link from "next/link";
import { Breadcrumbs, FreeHelp, H2, PageTitle, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { careerCount, hubs } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Career Change: Free Tools to Find Your Next Job",
  description: `Free career change tools built on O*NET and BLS data. See which of ${careerCount} careers use your skills, what they pay and what training they need.`,
  path: "/career-change",
});

const TOOLS = [
  {
    n: "01",
    title: "Career Change Tool",
    text: "Enter your job and filter matches by pay and extra education.",
    href: "/career-change/tool",
  },
  {
    n: "02",
    title: "Free Career Test",
    text: "Not sure where to go? Turn your interests into a shortlist.",
    href: "/career-test",
  },
  {
    n: "03",
    title: "Career Change Quiz",
    text: "Check how ready you are: money, time, support and skills.",
    href: "/career-change/quiz",
  },
  {
    n: "04",
    title: "Transferable Skills Finder",
    text: "List the skills you already have for a new job.",
    href: "/transferable-skills",
  },
];

export default function CareerChangeHome() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-12 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle highlight="Career change" after=" made practical" />
        <p className="m-0 text-lead">
          Start from the job you have. We compare its skills with {careerCount} U.S. careers using O*NET 31.0 and show
          pay from BLS May 2025, so you can see which moves are realistic and what each one takes.
        </p>
        <UpdatedLine />
      </section>
      <section aria-labelledby="tools" className="flex flex-col gap-6">
        <H2 id="tools">Tools</H2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col gap-2.5 rounded-lg border-[1.5px] border-mist bg-white p-6 text-ink no-underline shadow-md hover:border-primary hover:text-ink"
            >
              <span className="font-display text-small font-bold text-primary">{t.n}</span>
              <span className="font-display text-[22px] font-bold">{t.title}</span>
              <span className="text-muted">{t.text}</span>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="popular" className="flex flex-col gap-6">
        <H2 id="popular">Popular career changes</H2>
        <ul className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="m-0">
          <Link href="/career-change/from" className="font-extrabold">
            See all careers to change from →
          </Link>
        </p>
      </section>
      <FreeHelp />
      <SourcesBox />
    </div>
  );
}
