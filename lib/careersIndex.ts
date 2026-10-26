import "server-only";
import { buildListing, LISTING_SLUGS, type Listing } from "@/lib/listings";

export const SECTIONS: { kind: Listing["kind"]; id: string; title: string }[] = [
  { kind: "industry", id: "industry", title: "Careers by industry" },
  { kind: "education", id: "education", title: "Careers by education" },
  { kind: "personality", id: "personality", title: "Careers by personality" },
  { kind: "holland-code", id: "holland-code", title: "Careers by Holland code" },
  { kind: "salary", id: "salary", title: "Careers by salary" },
];

export function sectionLinks(kind: Listing["kind"]) {
  return LISTING_SLUGS[kind].map((s) => {
    const l = buildListing(kind, s)!;
    return { href: `/careers/${kind}/${s}`, label: l.h1, count: l.rows.length };
  });
}
