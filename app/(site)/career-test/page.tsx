import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, JsonLd, PageTitle, SourcesBox } from "@/components/page/Common";
import { CareerTest } from "@/components/tests/CareerTest";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Free Career Test: Find Careers That Fit You",
  description:
    "A free career test with 60 O*NET Interest Profiler activities and 13 workday questions. Get your interest code and careers that fit, with BLS pay.",
  path: "/career-test",
});

export default function CareerTestPage() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Tests", href: "/tests" }, { name: "Free Career Test" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Free " highlight="Career Test" />
        <p className="m-0 text-lead">
          Find careers that fit your interests and the workday you want. Part 1 is the U.S. Department of Labor’s O*NET
          Interest Profiler. Part 2 asks about people, pace, schedule, risk, training and pay.
        </p>
      </section>
      <CareerTest />
      <AdSlot size="leaderboard" id="ct-mid" />
      <FaqSection
        title="About this test"
        items={[
          {
            q: "What is the O*NET Interest Profiler?",
            a: "A free interest test from the U.S. Department of Labor based on Holland’s six interest areas (RIASEC). We use the 60-question Short Form unchanged and score it the official way: each area adds up answers from 0 (Strongly Dislike) to 4 (Strongly Like), for 0 to 40 points.",
          },
          {
            q: "How are careers matched to my results?",
            a: "Two ways, shown separately. The official O*NET method compares the shape of your six scores with each career’s O*NET interest profile and labels strong matches Best Fit or Great Fit. Our ranking adds your answers about the workday you want, using O*NET work context data.",
          },
          {
            q: "Is this test free and private?",
            a: "Yes. There is no sign-up, and your answers stay in your browser. A results link only works for people you share it with.",
          },
          {
            q: "How accurate is it?",
            a: "The Interest Profiler is a well-studied interest measure. Our workday questions are our own and have not been scientifically validated. Use your results as a starting point to explore, not as advice.",
          },
        ]}
      />
      <SourcesBox>
        Interest questions and scoring: O*NET Interest Profiler Short Form (USDOL/ETA), CC BY-ND 4.0. Career interest
        profiles, Job Zones and work context: O*NET 31.0 Database (CC BY 4.0). Pay: BLS OEWS May 2025.
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "Free Career Test",
          url: `${SITE.url}/career-test`,
          about: "Career interests (RIASEC) and work preferences",
          isAccessibleForFree: true,
          numberOfQuestions: 73,
        }}
      />
    </div>
  );
}
