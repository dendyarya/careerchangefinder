import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, JsonLd, PageTitle, SourcesBox } from "@/components/page/Common";
import { CollegeMajorQuiz } from "@/components/tests/CollegeMajorQuiz";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "College Major Quiz: Find Majors That Fit You",
  description:
    "A free college major quiz: 60 O*NET interest activities and 20 personality statements match you to majors and the careers and pay they lead to.",
  path: "/college-major-quiz",
});

export default function MajorQuizPage() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Tests", href: "/tests" }, { name: "College Major Quiz" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="College " highlight="Major Quiz" />
        <p className="m-0 text-lead">
          Find majors that fit your interests and the way you study and work, and see the careers and pay each one leads
          to.
        </p>
      </section>
      <CollegeMajorQuiz />
      <AdSlot size="leaderboard" id="mq-mid" />
      <FaqSection
        title="About this quiz"
        items={[
          {
            q: "How are majors matched?",
            a: "Each major is linked to the careers it leads to through the NCES CIP–SOC crosswalk. We compare your interest scores with those careers’ O*NET interest profiles (70%) and add how curious and organized you are compared with those careers’ O*NET work styles (30%).",
          },
          {
            q: "Which questions are used?",
            a: "Part 1 is the 60-question O*NET Interest Profiler Short Form, used unchanged. Part 2 is the 20 IPIP statements for Openness and Conscientiousness, which are public domain.",
          },
        ]}
      />
      <SourcesBox>
        O*NET Interest Profiler Short Form (USDOL/ETA, CC BY-ND 4.0); IPIP items (public domain); O*NET 31.0 interest
        profiles and work styles (CC BY 4.0); NCES CIP 2020 to SOC 2018 crosswalk; BLS OEWS May 2025.
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "College Major Quiz",
          url: `${SITE.url}/college-major-quiz`,
          about: "Choosing a college major",
          isAccessibleForFree: true,
          numberOfQuestions: 80,
        }}
      />
    </div>
  );
}
