/**
 * "Career change to oil and gas": BLS OEWS May 2025 industry estimates for Oil and Gas Extraction (NAICS 2111)
 * and crude oil and natural gas pipelines (NAICS 4861, 4862). Careers are linked to their profile through the
 * BLS SOC code. Data: data/processed/situations/industries.json (checked by verify_situations.py).
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { ageData } from "@/lib/agePages";
import { occupations } from "@/lib/data/server";
import { money } from "@/lib/format";

interface IndOcc { soc: string; title: string; employment: number | null; median: number | null; p10: number | null; p90: number | null; pct_of_industry: number | null }
interface Industry { naics: string; title: string; slug: string; total: IndOcc; occupations: IndOcc[] }
const data = () =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "processed", "situations", "industries.json"), "utf8")) as { industries: Record<string, Industry> };

export interface IndRow {
  soc: string;
  title: string;
  slug: string | null; // career profile
  jobs: number | null;
  median: number | null;
  usMedian: number | null;
  diff: number | null;
}

function rows(ind: Industry): IndRow[] {
  const bySoc = new Map<string, { slug: string; median: number | null }>();
  for (const o of occupations()) {
    if (o.thin || !o.wage || o.wage.is_group) continue;
    if (!bySoc.has(o.wage.bls_code)) bySoc.set(o.wage.bls_code, { slug: o.slug, median: o.wage.median });
  }
  return ind.occupations
    .filter((x) => x.employment != null)
    .map((x) => {
      const c = bySoc.get(x.soc);
      const us = c?.median ?? null;
      return {
        soc: x.soc,
        title: x.title,
        slug: c?.slug ?? null,
        jobs: x.employment,
        median: x.median,
        usMedian: us,
        diff: x.median == null || !us ? null : Math.round(((x.median - us) / us) * 100),
      };
    });
}

export function buildOilGas() {
  const d = data().industries;
  const ex = d["211100"]!;
  const pipes = [d["486200"]!, d["486100"]!];
  const exRows = rows(ex);
  const total = ex.total.employment! + pipes.reduce((s, p) => s + (p.total.employment ?? 0), 0);
  const us = ageData().all_workers.us_median_pay;
  const payMore = exRows.filter((r) => r.diff != null && r.diff >= 20 && (r.jobs ?? 0) >= 500).sort((a, b) => b.diff! - a.diff!);
  const title = "Career Change to Oil and Gas: Jobs and Pay";
  const description = `The ${exRows.length} jobs in U.S. oil and gas extraction and pipelines, with industry pay against the same job elsewhere. BLS May 2025 data.`;
  const intro = `Oil and gas extraction and oil and gas pipelines employ ${total.toLocaleString("en-US")} people in the U.S. The median pay across all jobs in oil and gas extraction is ${money(ex.total.median)}, against ${money(us)} for all U.S. jobs (BLS, May 2025). Below: the jobs these companies hire for, what they pay in the industry, and how that compares with the same job in other industries.`;
  const top = exRows.slice(0, 3).map((r) => r.title);
  const faq: Faq[] = [
    { q: "What jobs are there in oil and gas?", a: `In oil and gas extraction, the most common jobs are ${top.join(", ")} (BLS OEWS May 2025).` },
    { q: "Does oil and gas pay more?", a: `The median for all jobs in oil and gas extraction is ${money(ex.total.median)}, against ${money(us)} for all U.S. jobs. ${payMore.length} jobs with at least 500 workers pay at least 20% more in oil and gas extraction than the same job's national median.` },
    { q: "Which industries does this page cover?", a: "Oil and Gas Extraction (NAICS 2111) and Pipeline Transportation of Crude Oil (4861) and of Natural Gas (4862). Support services such as well drilling contractors and refineries are in wider BLS industries that also include other mining and coal products, so they are not included." },
  ];
  return { title, description, intro, ex, exRows, pipes: pipes.map((p) => ({ ...p, rows: rows(p) })), payMore, total, faq };
}
