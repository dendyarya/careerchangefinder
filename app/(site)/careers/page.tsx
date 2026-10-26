import Link from "next/link";
import { LinkGrid } from "@/components/listing/LinkGrid";
import { Breadcrumbs, H2, PageTitle, SourcesBox } from "@/components/page/Common";
import { careerCount } from "@/lib/data";
import { SECTIONS, sectionLinks } from "@/lib/careersIndex";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Explore Careers: Pay, Education and Personality",
  description: `Browse ${careerCount} U.S. careers by industry, education, personality, Holland code and salary, with O*NET 31.0 and BLS May 2025 data.`,
  path: "/careers",
});

export default function CareersHome() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-12 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Careers" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Explore " highlight={`${careerCount} careers`} />
        <p className="m-0 text-lead">
          Every career has a profile with pay, education, skills and the hard parts of the job. Browse by group below, see
          the <Link href="/careers/a-z">full A–Z list</Link>, or press <kbd className="font-sans font-bold">/</kbd> to search.
        </p>
      </section>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className="flex scroll-mt-6 flex-col gap-5">
          <H2 id={`h-${s.id}`}>{s.title}</H2>
          <LinkGrid links={sectionLinks(s.kind)} />
        </section>
      ))}
      <SourcesBox />
    </div>
  );
}
