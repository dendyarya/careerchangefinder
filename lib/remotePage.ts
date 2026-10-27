/**
 * "Career change to remote work" page. Remote-friendly = our estimate from O*NET 31.0 (method of
 * Dingel & Neiman 2020); telework rates = BLS CPS 2025 Table 62 by occupation group. Rules are printed
 * on the page and recomputed by QA.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { ageData, isPromotionRole } from "@/lib/agePages";
import { occupations } from "@/lib/data/server";
import { money } from "@/lib/format";

interface Tele {
  title: string;
  at_work_k: number;
  teleworkers_k: number;
  share_teleworked: number;
  pct_hours_teleworked: number;
}
interface RemoteFile {
  meta: { telework_total: Tele; telework_groups: Record<string, Tele>; licensed_prefixes: string[] };
  careers: Record<string, { remote_friendly: boolean; blockers: string[] }>;
}
let cache: RemoteFile | null = null;
function remoteData(): RemoteFile {
  cache ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "processed", "situations", "remote.json"), "utf8")) as RemoteFile;
  return cache;
}

export interface RemoteRow {
  slug: string;
  title: string;
  median: number;
  jobZone: number | null;
  groupShare: number; // share of workers in the occupation group who teleworked (BLS)
  groupTitle: string;
}

export function buildRemotePage() {
  const { careers, meta } = remoteData();
  const usMedian = ageData().all_workers.us_median_pay;
  const main: RemoteRow[] = occupations()
    .filter(
      (o) =>
        !o.thin &&
        !isPromotionRole(o) &&
        !meta.licensed_prefixes.some((p) => o.code.startsWith(p)) &&
        careers[o.code]?.remote_friendly &&
        o.wage &&
        !o.wage.is_group &&
        o.wage.median != null &&
        o.wage.median >= usMedian,
    )
    .map((o) => {
      const g = meta.telework_groups[o.code.slice(0, 2)]!;
      return { slug: o.slug, title: o.title, median: o.wage!.median!, jobZone: o.job_zone, groupShare: g.share_teleworked, groupTitle: g.title };
    })
    // fields where remote work is most common first, then pay
    .sort((a, b) => b.groupShare - a.groupShare || b.median - a.median || a.title.localeCompare(b.title));
  const noDegree = main.filter((r) => (r.jobZone ?? 9) <= 3);
  const groups = Object.entries(meta.telework_groups)
    .map(([soc, g]) => ({ soc, ...g }))
    .sort((a, b) => b.share_teleworked - a.share_teleworked);
  const t = meta.telework_total;
  const sharePct = Math.round(t.share_teleworked * 100);
  const title = "Career Change to Remote Work: Jobs You Can Do From Home";
  const description = `${main.length} careers whose work can mostly be done from home and that pay above the U.S. median, with real telework rates by field. BLS 2025 data.`;
  const intro = `In 2025, ${sharePct}% of U.S. workers did some or all of their work from home, and ${t.pct_hours_teleworked}% of all work hours were done remotely (BLS). Below are ${main.length} careers whose tasks can mostly be done from home and that pay more than the U.S. median of ${money(usMedian)}, with how often people in each field actually work remotely.`;
  const topGroup = groups[0]!;
  const faq: Faq[] = [
    {
      q: "How many Americans work from home?",
      a: `In 2025, ${(t.teleworkers_k / 1000).toFixed(1)} million of ${(t.at_work_k / 1000).toFixed(1)} million workers (${sharePct}%) teleworked or worked at home for pay for at least some hours (BLS Current Population Survey, Table 62).`,
    },
    {
      q: "Which fields have the most remote work?",
      a: `${topGroup.title.replace(/ occupations$/, "")}: ${Math.round(topGroup.share_teleworked * 100)}% of workers teleworked in 2025. ${groups[1]!.title.replace(/ occupations$/, "")} and ${groups[2]!.title.replace(/ occupations$/, "")} follow.`,
    },
    {
      q: "Can I get a remote job without a degree?",
      a: `${noDegree.length} careers on this page usually need two years or less of preparation. Remote work is still decided by each employer, so check job postings in your area.`,
    },
    {
      q: "How do you decide a job can be done from home?",
      a: "We apply the method of Dingel and Neiman (2020) to O*NET 31.0: a job is not remote-friendly if, for example, it rarely uses email, is mostly done outdoors, needs protective equipment, involves physical work, operating vehicles or machines, repairs, inspections, or working directly with the public. It is an estimate of what the work allows, not a count of remote job ads.",
    },
  ];
  return { title, description, intro, main, noDegree, groups, total: t, usMedian, faq };
}
