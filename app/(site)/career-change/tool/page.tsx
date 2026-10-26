import { AdSlot } from "@/components/AdSlot";
import {
  Breadcrumbs,
  FreeHelp,
  JsonLd,
  PageTitle,
  RelatedLinks,
  SourcesBox,
  UpdatedLine,
} from "@/components/page/Common";
import { careerCount } from "@/lib/data";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { CareerChangeTool } from "./CareerChangeTool";

export const metadata = pageMeta({
  title: "Career Change Tool: Find Jobs That Use Your Skills",
  description: `Enter your current job and see ${careerCount} U.S. careers ranked by skill match, with BLS median pay, pay change and the extra education each one needs.`,
  path: "/career-change/tool",
});

export default function ToolPage() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Career Change Tool" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career Change " highlight="Tool" />
        <p className="m-0 text-lead">
          Tell us your current job. We compare its skills with {careerCount} U.S. careers and show what each move pays
          and how much extra education it usually needs. Filter by education and pay to find realistic next steps.
        </p>
        <UpdatedLine />
      </section>
      <CareerChangeTool />
      <AdSlot size="leaderboard" id="tool-mid" />
      <FreeHelp />
      <RelatedLinks
        links={[
          { label: "Jobs for former teachers", href: "/career-change/from-teacher" },
          { label: "Jobs for former nurses", href: "/career-change/from-nurse" },
          { label: "All careers to change from", href: "/career-change/from" },
          { label: "How we match careers", href: "/methodology" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Career Change Tool",
          url: `${SITE.url}/career-change/tool`,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
    </div>
  );
}
