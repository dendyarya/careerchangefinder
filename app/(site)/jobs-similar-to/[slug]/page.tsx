import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { MiniList, SimilarTable, JZ } from "@/components/similar/SimilarTable";
import { Breadcrumbs, FaqSection, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { money } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { buildSimilar, similarSlugs } from "@/lib/similarJobs";
import { AlsoCalled } from "@/components/page/AlsoCalled";

export const dynamicParams = false;
export const generateStaticParams = () => similarSlugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = buildSimilar((await params).slug);
  if (!m) return {};
  return pageMeta({ title: m.title, description: m.description, path: `/jobs-similar-to/${m.slug}` });
}

export default async function SimilarPage({ params }: { params: Promise<{ slug: string }> }) {
  const m = buildSimilar((await params).slug);
  if (!m) notFound();
  const url = `${SITE.url}/jobs-similar-to/${m.slug}`;
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Jobs Similar To", href: "/jobs-similar-to" }, { name: m.name }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Jobs Similar to " highlight={m.name} />
        <AlsoCalled slug={m.slug} />
        <p className="m-0 text-lead">{m.intro}</p>
        <p className="m-0 text-slate">
          {m.name}: {m.group ? `${money(m.median)} (broader BLS group)` : `${money(m.median)} median pay`}
          {m.jobZone ? ` · usual preparation: ${JZ[m.jobZone]}` : ""}.
        </p>
        <UpdatedLine />
      </section>

      <AdSlot size="leaderboard" id="similar-top" />

      <section aria-labelledby="h-most" className="flex flex-col gap-5">
        <H2 id="h-most">The {m.rows.length} most similar careers</H2>
        <SimilarTable rows={m.rows} name={m.name} />
        <p className="m-0 text-small text-muted">
          Similarity: weighted correlation of O*NET 31.0 transferable skills (35%), knowledge (25%), work activities
          (15%) and interests (15%). Pay and schooling do not change it. Pay change compares BLS May 2025 national
          medians; careers with only a broader BLS group wage are not compared. “Same group”: the same BLS
          occupation group (SOC minor group).{" "}
          <Link href="/methodology">Methodology</Link>
        </p>
      </section>

      {m.payMore.length > 0 && (
        <section aria-labelledby="h-pay" className="flex flex-col gap-5">
          <H2 id="h-pay">Similar jobs that pay more</H2>
          <p className="m-0 -mt-2 text-slate">Only careers that usually need no more preparation than {m.nameLower}.</p>
          <MiniList rows={m.payMore} show="pay" />
        </section>
      )}

      {m.lessPrep.length > 0 && (
        <section aria-labelledby="h-prep" className="flex flex-col gap-5">
          <H2 id="h-prep">Similar jobs that need less preparation</H2>
          <MiniList rows={m.lessPrep} show="prep" />
        </section>
      )}

      <section aria-labelledby="h-move" className="flex flex-col gap-4 rounded-xl bg-panel p-6 md:p-8">
        <h2 id="h-move" className="m-0 font-display text-[28px] font-bold">
          Thinking of a career change?
        </h2>
        <p className="m-0 max-w-[760px]">
          Similar is not the same as a good next step. Our career-change list for {m.nameLower} also weighs pay drops and
          extra schooling, and puts jobs outside the field first.
        </p>
        <p className="m-0">
          <Link href={m.fromPage} className="font-extrabold">
            Jobs for former {m.nameLower} →
          </Link>
        </p>
      </section>

      {m.into.length > 0 && (
        <section aria-labelledby="h-into" className="flex flex-col gap-4">
          <H2 id="h-into">Jobs that can lead here</H2>
          <p className="m-0 text-slate">
            Careers where {m.nameLower} is one of the best career-change matches (match score in brackets).
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {m.into.map((x) => (
              <li key={x.slug}>
                <Link href={`/jobs-similar-to/${x.slug}`} className="block rounded-[12px] border-[1.5px] border-mist px-4 py-2.5 font-bold text-ink no-underline hover:border-primary">
                  {x.title} <span className="font-medium text-muted">({x.match})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FaqSection title={`Questions about jobs like ${m.nameLower}`} items={m.faq} />
      <RelatedLinks
        links={[
          { label: `${m.name} career profile`, href: `/careers/${m.slug}` },
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
          { label: "Career Change Tool", href: `/career-change/tool?job=${m.slug}` },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Jobs similar to ${m.name}`,
          url,
          numberOfItems: m.rows.length,
          itemListElement: m.rows.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE.url}/careers/${r.slug}` })),
        }}
      />
    </div>
  );
}
