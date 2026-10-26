import { Breadcrumbs, FreeHelp, PageTitle, SourcesBox } from "@/components/page/Common";
import { CareerChangeQuiz } from "@/components/tools/CareerChangeQuiz";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Career Change Quiz: Are You Ready to Switch?",
  description:
    "Ten quick questions about money, time, support, skills and training show how ready you are to change careers, with a personal action plan. Free, no sign-up.",
  path: "/career-change/quiz",
});

export default function QuizPage() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Career Change Quiz" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career Change " highlight="Quiz" />
        <p className="m-0 text-lead">
          Ten questions about where you are today. You get a readiness level and a short action plan for the areas that
          need work.
        </p>
      </section>
      <CareerChangeQuiz />
      <FreeHelp />
      <SourcesBox>Our own planning checklist. It is not a scientific test and not financial advice.</SourcesBox>
    </div>
  );
}
