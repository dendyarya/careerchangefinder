import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs, FaqSection, JsonLd, PageTitle, SourcesBox } from "@/components/page/Common";
import { BigFiveTest } from "@/components/tests/BigFiveTest";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Free Big Five Personality Test (50 Questions)",
  description:
    "Take a free Big Five personality test with 50 public-domain IPIP statements. See your five trait scores and careers that fit them. No sign-up.",
  path: "/big-five-personality-test",
});

export default function BigFivePage() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Tests", href: "/tests" }, { name: "Big Five Personality Test" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Big Five " highlight="Personality Test" />
        <p className="m-0 text-lead">
          Fifty short statements measure five broad traits: Extraversion, Agreeableness, Conscientiousness, Emotional
          Stability and Openness. Your results link to careers that fit your highest trait.
        </p>
      </section>
      <BigFiveTest />
      <AdSlot size="leaderboard" id="b5-mid" />
      <FaqSection
        title="About this test"
        items={[
          {
            q: "Where do the questions come from?",
            a: "The 50 statements are the IPIP Big-Five Factor Markers from the International Personality Item Pool, a public-domain collection of personality items (ipip.ori.org). They are scored with the official IPIP keys.",
          },
          {
            q: "How are my scores calculated?",
            a: "Each trait has 10 statements. Answers count 1 to 5, reversed for statements that point the other way, and add up to a score from 10 to 50. Low, medium and high are equal thirds of that range. They are not comparisons with other people.",
          },
          {
            q: "Is this a clinical or hiring test?",
            a: "No. It is a free self-reflection tool. It does not diagnose anything and should not be used to make hiring decisions.",
          },
          {
            q: "How are careers matched to my traits?",
            a: "We link each trait to related O*NET 31.0 Work Styles, such as Social Orientation for Extraversion or Attention to Detail for Conscientiousness, and list careers where those styles matter most.",
          },
        ]}
      />
      <SourcesBox>
        Questions: International Personality Item Pool (IPIP), public domain; Goldberg, L. R. (1992), The development of
        markers for the Big-Five factor structure. Career links: O*NET 31.0 Work Styles (USDOL/ETA, CC BY 4.0). Pay: BLS
        OEWS May 2025.
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "Big Five Personality Test",
          url: `${SITE.url}/big-five-personality-test`,
          about: "Big Five personality traits",
          educationalUse: "self-assessment",
          isAccessibleForFree: true,
          numberOfQuestions: 50,
        }}
      />
    </div>
  );
}
