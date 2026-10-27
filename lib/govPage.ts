/**
 * "Career change to government jobs" page. BLS OEWS May 2025 national estimates by ownership
 * (data/processed/situations/government.json). Rules are printed on the page and recomputed by QA.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { isPromotionRole } from "@/lib/agePages";
import { occupations } from "@/lib/data/server";
import { money } from "@/lib/format";

type Part = { employment: number | null; median: number | null; p10: number | null; p90: number | null };
type Own = "federal" | "state" | "local" | "government" | "private";
interface GovRec extends Partial<Record<Own, Part>> {
  bls_code: string;
  gov_share: number | null;
}
interface GovFile {
  meta: { all_occupations: Record<Own, Part> };
  careers: Record<string, GovRec>;
}
let cache: GovFile | null = null;
function govData(): GovFile {
  cache ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "processed", "situations", "government.json"), "utf8")) as GovFile;
  return cache;
}

export const GOV_MIN_JOBS = 10000; // main list
export const GOV_COMPARE_MIN = 5000; // both sides for the "pays more" list
export const FED_MIN_JOBS = 5000;

export interface GovRow {
  slug: string;
  title: string;
  jobZone: number | null;
  govJobs: number;
  govShare: number | null;
  govMedian: number | null;
  privMedian: number | null;
  privJobs: number | null;
  diff: number | null; // government vs private median, %
  fedJobs: number | null;
  fedMedian: number | null;
}

const pctDiff = (a: number | null, b: number | null) => (a == null || !b ? null : Math.round(((a - b) / b) * 100));

function allRows(): GovRow[] {
  const { careers } = govData();
  return occupations()
    .filter((o) => !o.thin && o.wage && !o.wage.is_group && !isPromotionRole(o))
    .flatMap((o) => {
      const g = careers[o.code];
      const gov = g?.government;
      if (!g || !gov?.employment) return [];
      return [
        {
          slug: o.slug,
          title: o.title,
          jobZone: o.job_zone,
          govJobs: gov.employment,
          govShare: g.gov_share,
          govMedian: gov.median,
          privMedian: g.private?.median ?? null,
          privJobs: g.private?.employment ?? null,
          diff: pctDiff(gov.median, g.private?.median ?? null),
          fedJobs: g.federal?.employment ?? null,
          fedMedian: g.federal?.median ?? null,
        },
      ];
    });
}

export function buildGovPage() {
  const rows = allRows();
  const all = govData().meta.all_occupations;
  const main = rows.filter((r) => r.govJobs >= GOV_MIN_JOBS).sort((a, b) => b.govJobs - a.govJobs || a.title.localeCompare(b.title));
  const payMore = rows
    .filter((r) => r.diff != null && r.diff >= 10 && r.govJobs >= GOV_COMPARE_MIN && (r.privJobs ?? 0) >= GOV_COMPARE_MIN)
    .sort((a, b) => b.diff! - a.diff! || a.title.localeCompare(b.title));
  const federal = rows.filter((r) => (r.fedJobs ?? 0) >= FED_MIN_JOBS).sort((a, b) => b.fedJobs! - a.fedJobs! || a.title.localeCompare(b.title));

  const gov = all.government;
  const priv = all.private;
  const govJobsM = (gov.employment! / 1e6).toFixed(1);
  const title = "Career Change to Government Jobs: Pay and Openings";
  const description = `Government employs ${govJobsM} million Americans. Compare pay in federal, state and local government with private jobs for ${main.length} careers. BLS May 2025.`;
  const intro = `Federal, state and local governments employ ${govJobsM} million people, about ${Math.round((gov.employment! / (gov.employment! + priv.employment!)) * 100)}% of U.S. jobs. Their median pay is ${money(gov.median)}, against ${money(priv.median)} in private companies (BLS, May 2025). Below are the ${main.length} careers with at least ${GOV_MIN_JOBS.toLocaleString("en-US")} government jobs, with government and private pay side by side.`;
  const top3 = main.slice(0, 3).map((r) => r.title).join(", ");
  const faq: Faq[] = [
    {
      q: "Do government jobs pay more than private jobs?",
      a: `Overall, yes: the median is ${money(gov.median)} in government and ${money(priv.median)} in private companies (BLS OEWS May 2025). It depends on the job: in ${payMore.length} careers government pays at least 10% more, while in others private employers pay more.`,
    },
    {
      q: "What government jobs have the most openings?",
      a: `The careers with the most government jobs are ${top3}. Federal, state and local governments together employ ${govJobsM} million people.`,
    },
    {
      q: "Where are federal jobs listed?",
      a: "Federal jobs are listed on USAJOBS.gov, the official job site of the U.S. federal government. State and local jobs are posted on each state, county or city government website.",
    },
    {
      q: "Where do these numbers come from?",
      a: "BLS Occupational Employment and Wage Statistics, May 2025, national estimates by ownership. Government includes public schools and hospitals and the U.S. Postal Service. Supervisor and manager jobs are left out because they are usually filled by promotion.",
    },
  ];
  return { title, description, intro, main, payMore, federal, all, faq };
}
