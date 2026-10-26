import { LinkGrid } from "@/components/listing/LinkGrid";
import { Breadcrumbs, PageTitle, SourcesBox } from "@/components/page/Common";
import { SECTIONS, sectionLinks } from "@/lib/careersIndex";
import { pageMeta } from "@/lib/seo";

const S = SECTIONS.find((s) => s.kind === "holland-code")!;

export const metadata = pageMeta({
  title: "Careers by Holland Code: RIASEC Interest Areas",
  description: `Browse U.S. careers ${S.title.replace("Careers ", "").toLowerCase()}: each list shows BLS median pay and the usual preparation, from O*NET 31.0 data.`,
  path: "/careers/holland-code",
});

export default function Page() {
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Careers", href: "/careers" }, { name: S.title }]} />
      <PageTitle highlight={S.title} />
      <LinkGrid links={sectionLinks("holland-code")} />
      <SourcesBox />
    </div>
  );
}
