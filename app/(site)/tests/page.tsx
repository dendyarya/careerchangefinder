import { LinkGrid } from "@/components/listing/LinkGrid";
import { Breadcrumbs, H2, PageTitle, SourcesBox } from "@/components/page/Common";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Free Career, Personality and College Tests",
  description:
    "Free tests with no sign-up: a career test based on the O*NET Interest Profiler, a Big Five personality test, a college major quiz and a career change quiz.",
  path: "/tests",
});

const GROUPS = [
  {
    id: "career",
    title: "Career tests",
    links: [
      { href: "/career-test", label: "Free Career Test (O*NET Interest Profiler)" },
      { href: "/career-change/quiz", label: "Career Change Quiz" },
      { href: "/transferable-skills", label: "Transferable Skills Finder" },
    ],
  },
  { id: "college", title: "College tests", links: [{ href: "/college-major-quiz", label: "College Major Quiz" }] },
  { id: "personality", title: "Personality tests", links: [{ href: "/big-five-personality-test", label: "Big Five Personality Test" }] },
  {
    id: "results",
    title: "Test results explained",
    links: [
      { href: "/tests/results/holland-codes", label: "Holland Codes Explained" },
      { href: "/tests/results/big-five", label: "Big Five Traits Explained" },
    ],
  },
];

export default function TestsHub() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-12 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Tests" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Free " highlight="career tests" />
        <p className="m-0 text-lead">
          All tests are free, need no sign-up and run in your browser. Your answers are not sent to us or stored.
        </p>
      </section>
      {GROUPS.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`h-${g.id}`} className="flex scroll-mt-6 flex-col gap-5">
          <H2 id={`h-${g.id}`}>{g.title}</H2>
          <LinkGrid links={g.links} />
        </section>
      ))}
      <SourcesBox>
        The career test uses the O*NET Interest Profiler Short Form (USDOL/ETA, CC BY-ND 4.0, used unchanged). The
        Big Five test uses public-domain IPIP items. Career data: O*NET 31.0 (CC BY 4.0) and BLS OEWS May 2025.
      </SourcesBox>
    </div>
  );
}
