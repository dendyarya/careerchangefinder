import "server-only";
import { buildAgePage, AGE_SLUGS } from "@/lib/agePages";
import { careerProfileIndexable } from "@/lib/careerProfile";
import { meta } from "@/lib/data";
import { occupations } from "@/lib/data/server";
import { money } from "@/lib/format";
import { LISTING_SLUGS, buildListing, type Listing } from "@/lib/listings";
import { SITE } from "@/lib/site";

const JZ: Record<number, string> = {
  1: "a few months or less",
  2: "up to a year",
  3: "1-2 years",
  4: "a bachelor's degree",
  5: "a graduate degree",
};
const head = () => `# ${SITE.name}

> ${SITE.description} Data: O*NET 31.0 (USDOL/ETA, CC BY 4.0), BLS Occupational Employment and Wage Statistics May 2025, BLS Current Population Survey 2025, NCES CIP 2020 to SOC 2018 crosswalk. Updated ${meta.built_at.slice(0, 10)}.

Every number on the site comes from these public U.S. government datasets. Methodology: ${SITE.url}/methodology
`;

export function llmsTxt(): string {
  const u = (p: string) => `${SITE.url}${p}`;
  return `${head()}
## Tools
- [Career Change Tool](${u("/career-change/tool")}): careers that use the skills of your current job, ranked by a match score
- [Free Career Test](${u("/career-test")}): O*NET Interest Profiler short form, unchanged
- [Big Five Personality Test](${u("/big-five-personality-test")}): public-domain IPIP 50-item test
- [College Major Quiz](${u("/college-major-quiz")})
- [Transferable Skills Finder](${u("/transferable-skills")})

## Main sections
- [Jobs for former …](${u("/career-change/from")}): one page per job with the best career-change options
- [Career profiles](${u("/careers/a-z")}): pay, education, skills and the hard parts of each job
- [Jobs similar to …](${u("/jobs-similar-to")})
- [Careers by industry, education, personality and salary](${u("/careers")})
- ${AGE_SLUGS.map((s) => `[Career change at ${s.slice(3)}](${u(`/career-change/${s}`)})`).join(", ")}
- [Career change to tech](${u("/career-change/to-tech")}), [healthcare](${u("/career-change/to-healthcare")}), [nursing](${u("/career-change/to-nursing")}), [skilled trades](${u("/career-change/to-skilled-trades")}), [government](${u("/career-change/to-government")}), [remote work](${u("/career-change/to-remote-work")})

## Research
- [Better-paying careers within reach](${u("/research/better-paying-careers")}): share of U.S. careers, nationally and by state, with a close match that pays at least 10% more and needs no more preparation
- [Same job, different pay](${u("/research/same-job-different-pay")}): how much the state changes pay for the same job: a same-job pay index for every state and the gap between the highest- and lowest-paying state for every career with enough state data (CSV downloads)

## About this site
- [Methodology](${u("/methodology")}): how match scores, pay comparisons and lists are calculated
- [Data Sources & Licenses](${u("/data-sources")})
- [About](${u("/about")}), [Alternatives](${u("/alternatives")})

## Optional
- [Full page list with key figures](${u("/llms-full.txt")})
- [Sitemap](${u("/sitemap.xml")})
`;
}

export function llmsFullTxt(): string {
  const u = (p: string) => `${SITE.url}${p}`;
  const careers = occupations()
    .filter((o) => careerProfileIndexable(o.slug))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((o) => {
      const w = o.wage;
      const pay = w?.median
        ? `median pay ${money(w.median)}${w.is_group ? " (broader BLS group)" : ""}`
        : "pay not published";
      return `- [${o.title}](${u(`/careers/${o.slug}`)}): ${pay}; usual preparation ${o.job_zone ? JZ[o.job_zone] : "unknown"}`;
    });
  const kinds = Object.keys(LISTING_SLUGS) as Listing["kind"][];
  const lists = kinds.flatMap((k) =>
    LISTING_SLUGS[k]
      .map((s) => buildListing(k, s))
      .filter((l) => l)
      .map((l) => `- [${l!.h1}](${u(`/careers/${l!.kind}/${l!.slug}`)}): ${l!.rows.length} careers`),
  );
  const ages = AGE_SLUGS.map((s) => {
    const m = buildAgePage(s);
    return `- [Career change at ${m.age}](${u(`/career-change/${s}`)}): ${m.main.length} careers`;
  });
  return `${llmsTxt()}
## Career change by age
${ages.join("\n")}

## Career lists
${lists.join("\n")}

## Career profiles (${careers.length})
${careers.join("\n")}
`;
}
