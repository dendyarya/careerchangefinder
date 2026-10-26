import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { ListingTable } from "@/components/listing/ListingTable";
import { Breadcrumbs, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { buildListing, LISTING_SLUGS, type Listing } from "@/lib/listings";
import { clip } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";


const KIND_LABEL: Record<Listing["kind"], { crumb: string; href: string }> = {
  industry: { crumb: "By Industry", href: "/careers/industry" },
  education: { crumb: "By Education", href: "/careers#education" },
  personality: { crumb: "By Personality", href: "/careers#personality" },
  "holland-code": { crumb: "By Holland Code", href: "/careers/holland-code" },
  salary: { crumb: "By Salary", href: "/careers#salary" },
};

export const listingParams = (kind: Listing["kind"]) => LISTING_SLUGS[kind].map((slug) => ({ slug }));

export function listingMeta(kind: Listing["kind"], slug: string) {
  const l = buildListing(kind, slug);
  if (!l) return {};
  return pageMeta({ title: l.title, description: clip(`${l.intro} Data: O*NET 31.0 and BLS OEWS May 2025.`, 160), path: `/careers/${l.kind}/${l.slug}` });
}

export function ListingView({ kind, slug }: { kind: Listing["kind"]; slug: string }) {
  const l = buildListing(kind, slug);
  if (!l) notFound();
  const k = KIND_LABEL[l.kind];
  const extraLabel = l.kind === "holland-code" ? "Holland code" : l.rows.some((r) => r.extra) ? "Interest score" : undefined;
  const others = LISTING_SLUGS[l.kind].filter((s) => s !== l.slug).slice(0, 6);
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-8 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Careers", href: "/careers" }, { name: k.crumb, href: k.href }, { name: l.h1 }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle highlight={l.h1} />
        <p className="m-0 text-lead">{l.intro}</p>
        <UpdatedLine />
      </section>
      <AdSlot size="leaderboard" id="list-top" />
      <ListingTable rows={l.rows} extraLabel={extraLabel} />
      <p className="m-0 text-small text-muted">How this list is made: {l.rule} Pay: BLS OEWS May 2025 national median.</p>
      <RelatedLinks
        links={others.map((s) => ({ label: buildListing(l.kind, s)!.h1, href: `/careers/${l.kind}/${s}` }))}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <p className="m-0">
        <Link href="/careers" className="font-extrabold">
          All ways to browse careers →
        </Link>
      </p>
      <SourcesBox />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: l.h1,
          url: `${SITE.url}/careers/${l.kind}/${l.slug}`,
          numberOfItems: l.rows.length,
          itemListElement: l.rows.slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE.url}/careers/${r.slug}` })),
        }}
      />
    </div>
  );
}
