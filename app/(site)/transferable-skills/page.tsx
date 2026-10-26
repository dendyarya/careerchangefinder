import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { SkillsFinder } from "@/components/tools/SkillsFinder";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Transferable Skills Finder: What Carries Over",
  description:
    "See your transferable skills from O*NET data, then compare them with any job: which skills carry over and which ones you need to build up. Free, no sign-up.",
  path: "/transferable-skills",
});

export default function SkillsPage() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs
        items={[{ name: "Career Change", href: "/career-change" }, { name: "Transferable Skills Finder" }]}
      />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Transferable Skills " highlight="Finder" />
        <p className="m-0 text-lead">
          Pick your current job to see the skills it builds, ranked by how important they are. Then pick a job you are
          considering to see what carries over and what to learn.
        </p>
        <UpdatedLine sources="O*NET 31.0 Transferable Skills" />
      </section>
      <SkillsFinder />
      <AdSlot size="leaderboard" id="skills-mid" />
      <FaqSection
        title="About transferable skills"
        items={[
          {
            q: "What are transferable skills?",
            a: "Skills you build in one job that are useful in others, such as coordinating people, judgment and decision making, or instructing. O*NET rates how important each of them is in every U.S. occupation.",
          },
          {
            q: "Where do the numbers come from?",
            a: "From the O*NET 31.0 Transferable Skills ratings (importance, scale 1 to 5), published by the U.S. Department of Labor. They describe a typical worker in each job.",
          },
        ]}
      />
      <RelatedLinks
        links={[
          { label: "Career Change Tool", href: "/career-change/tool" },
          { label: "Career Change Quiz", href: "/career-change/quiz" },
          { label: "Jobs for former teachers", href: "/career-change/from-teacher" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>Skills: O*NET 31.0 Database, Transferable Skills (importance), USDOL/ETA, CC BY 4.0.</SourcesBox>
    </div>
  );
}
