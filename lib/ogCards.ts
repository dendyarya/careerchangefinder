import "server-only";
import { buildAgePage, AGE_SLUGS, type AgeSlug } from "@/lib/agePages";
import { buildFromPage } from "@/lib/careerChangePage";
import { buildProfile } from "@/lib/careerProfile";
import { buildFieldPage, FIELD_SLUGS, type FieldSlug } from "@/lib/fieldPages";
import { money } from "@/lib/format";
import { buildGovPage } from "@/lib/govPage";
import { buildListing, type Listing } from "@/lib/listings";
import { buildRemotePage } from "@/lib/remotePage";
import { buildSalary, buildStateSalary } from "@/lib/salary";
import { buildSimilar } from "@/lib/similarJobs";
import { SITUATION_SLUGS } from "@/lib/situations";
import type { OgCard } from "@/lib/og";

/** Card text for a page path, or null when the path is not a real page. */
export function ogCard(path: string): OgCard | null {
  const p = path.split("/").filter(Boolean);
  if (p[0] === "careers" && p.length === 2) {
    const m = buildProfile(p[1]!);
    if (!m) return null;
    const w = m.o.wage;
    return { eyebrow: "Career profile", title: m.name, stat: w?.median ? { label: w.is_group ? "Median pay (broader BLS group)" : "Median pay", value: money(w.median) } : undefined };
  }
  if (p[0] === "careers" && p.length === 3 && p[2] === "salary") {
    const m = buildSalary(p[1]!);
    return m ? { eyebrow: "Salary by state", title: m.name, stat: { label: `Highest: ${m.hi.state}`, value: money(m.hi.median) } } : null;
  }
  if (p[0] === "careers" && p.length === 4 && p[2] === "salary") {
    const m = buildStateSalary(p[1]!, p[3]!);
    return m ? { eyebrow: `Salary in ${m.s.state}`, title: m.name, stat: { label: "Median pay", value: money(m.s.median) } } : null;
  }
  if (p[0] === "careers" && p.length === 3) {
    const l = buildListing(p[1] as Listing["kind"], p[2]!);
    return l ? { eyebrow: "Careers", title: l.h1, stat: { label: "Careers on the list", value: String(l.rows.length) } } : null;
  }
  if (p[0] === "career-change" && p.length === 2) {
    const s = p[1]!;
    if (s.startsWith("from-")) {
      const m = buildFromPage(s.slice(5));
      return m ? { eyebrow: "Career change", title: `Jobs for former ${m.pluralLower}`, stat: { label: "Best match", value: `${m.rows[0]?.title ?? ""}` } } : null;
    }
    if (!SITUATION_SLUGS.includes(s)) return null;
    if ((AGE_SLUGS as readonly string[]).includes(s)) {
      const m = buildAgePage(s as AgeSlug);
      return { eyebrow: "Career change", title: `Career change at ${m.age}`, stat: { label: "Careers to start", value: String(m.main.length) } };
    }
    if ((FIELD_SLUGS as readonly string[]).includes(s)) {
      const m = buildFieldPage(s as FieldSlug);
      return { eyebrow: "Career change", title: `Career change to ${m.h1}`, stat: { label: "U.S. jobs", value: m.jobsTotal.toLocaleString("en-US") } };
    }
    if (s === "to-government") {
      const m = buildGovPage();
      return { eyebrow: "Career change", title: "Career change to government jobs", stat: { label: "Median pay, government", value: money(m.all.government.median) } };
    }
    if (s === "to-remote-work") {
      const m = buildRemotePage();
      return { eyebrow: "Career change", title: "Career change to remote work", stat: { label: "Careers on the list", value: String(m.main.length) } };
    }
    return null;
  }
  if (p[0] === "jobs-similar-to" && p.length === 2) {
    const m = buildSimilar(p[1]!);
    return m ? { eyebrow: "Jobs similar to", title: m.name, stat: { label: "Most similar", value: m.rows[0]?.title ?? "" } } : null;
  }
  return null;
}
