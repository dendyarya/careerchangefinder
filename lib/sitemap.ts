/**
 * Sitemap entries, one list per section (runbook Tahap 6). Only published pages that are indexed:
 * no thin career profiles, and state salary pages only above STATE_INDEX_MIN_EMPLOYMENT.
 * scripts/qa/check_sitemaps.py checks every URL against the built pages.
 */
import "server-only";
import { careerProfileIndexable } from "@/lib/careerProfile";
import { buildListing, LISTING_SLUGS, type Listing } from "@/lib/listings";
import { careerChangeSources, occupations } from "@/lib/data/server";
import { meta } from "@/lib/data";
import { listGuides } from "@/lib/guides";
import { STATIC_SLUGS } from "@/lib/staticPages";
import { isPublished } from "@/lib/published";
import { salarySlugs, stateSlug, STATE_INDEX_MIN_EMPLOYMENT } from "@/lib/salary";
import { statePay } from "@/lib/careerProfile";
import { similarSlugs } from "@/lib/similarJobs";
import { SITUATION_SLUGS } from "@/lib/situations";
import { RESULT_SLUGS } from "@/lib/traits";

export interface Entry {
  path: string;
  lastmod: string;
}
export const SITEMAP_NAMES = [
  "pages",
  "career-change",
  "careers",
  "jobs-similar-to",
  "salary",
  "salary-states",
  "guides",
] as const;
export type SitemapName = (typeof SITEMAP_NAMES)[number];

const day = (iso: string) => iso.slice(0, 10);

export async function sitemapEntries(name: SitemapName): Promise<Entry[]> {
  const built = day(meta.built_at);
  const e = (path: string, lastmod = built): Entry => ({ path, lastmod });
  switch (name) {
    case "pages":
      return [
        "/",
        "/career-test",
        "/big-five-personality-test",
        "/college-major-quiz",
        "/transferable-skills",
        "/tests",
        "/tests/results/big-five",
        "/tests/results/holland-codes",
        ...STATIC_SLUGS.map((s) => `/${s}`),
        ...RESULT_SLUGS.filter((t) => isPublished("tests", `results/${t}`)).map((t) => `/tests/results/${t}`),
      ].map((p) => e(p));
    case "career-change":
      return [
        "/career-change",
        "/career-change/from",
        "/career-change/tool",
        "/career-change/quiz",
        ...SITUATION_SLUGS.map((s) => `/career-change/${s}`),
        ...careerChangeSources().map((s) => `/career-change/from-${s}`),
      ].map((p) => e(p));
    case "careers": {
      const kinds = Object.keys(LISTING_SLUGS) as Listing["kind"][];
      return [
        "/careers",
        "/careers/a-z",
        "/careers/industry",
        "/careers/holland-code",
        ...kinds.flatMap((k) =>
          LISTING_SLUGS[k]
            .filter((s) => isPublished("careers-listings", `${k}/${s}`) && buildListing(k, s))
            .map((s) => `/careers/${k}/${s}`),
        ),
        ...occupations()
          .filter((o) => careerProfileIndexable(o.slug))
          .map((o) => `/careers/${o.slug}`),
      ].map((p) => e(p));
    }
    case "jobs-similar-to":
      return ["/jobs-similar-to", ...similarSlugs().map((s) => `/jobs-similar-to/${s}`)].map((p) => e(p));
    case "salary":
      return salarySlugs().map((s) => e(`/careers/${s}/salary`));
    case "salary-states":
      return salarySlugs().flatMap((s) =>
        statePay(s)
          .filter((st) => st.employment != null && st.employment >= STATE_INDEX_MIN_EMPLOYMENT)
          .map((st) => `/careers/${s}/salary/${stateSlug(st.state)}`)
          .filter((p) => isPublished("salary-states", p.replace("/careers/", "").replace("/salary/", "/")))
          .map((p) => e(p)),
      );
    case "guides": {
      const g = await listGuides();
      return [
        e("/guides"),
        ...g
          .filter((x) => !x.draft)
          .map((x) => e(`/guides/${x.slug}`, day(x.updatedAt || x.publishedAt || meta.built_at))),
      ];
    }
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function urlsetXml(base: string, entries: Entry[]): string {
  const body = entries
    .map((x) => `<url><loc>${esc(base + x.path)}</loc><lastmod>${x.lastmod}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function indexXml(base: string, lastmod: string): string {
  const body = SITEMAP_NAMES.map(
    (n) => `<sitemap><loc>${base}/sitemaps/${n}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
