/**
 * "Career change at [age]" pages. Lists are filters over data/processed: BLS CPS 2025 age data
 * (situations/age.json), BLS OEWS May 2025 pay and O*NET 31.0 Job Zones. Rules are printed on the page.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { occupations, type Occupation } from "@/lib/data/server";
import { money } from "@/lib/format";

const P = path.join(process.cwd(), "data", "processed", "situations");

export interface AgeRec {
  cps_titles: string[];
  total_k: number;
  bands_k: Record<string, number>;
  median_age: number | null;
  share_45_plus: number | null;
  share_55_plus: number | null;
  share_under_35: number | null;
  group: boolean;
  enough_data: boolean;
}
interface AgeFile {
  all_workers: {
    total_k: number;
    bands_k: Record<string, number>;
    median_age: number;
    share_45_plus: number;
    share_55_plus: number;
    us_median_pay: number;
  };
  careers: Record<string, AgeRec>;
}
let cache: AgeFile | null = null;
export function ageData(): AgeFile {
  cache ??= JSON.parse(fs.readFileSync(path.join(P, "age.json"), "utf8")) as AgeFile;
  return cache;
}

export const AGE_BANDS = ["16-19", "20-24", "25-34", "35-44", "45-54", "55-64", "65+"];
export const JZ_PREP: Record<number, string> = {
  1: "A few months or less",
  2: "Up to a year",
  3: "1–2 years (training or associate)",
  4: "A bachelor's degree",
  5: "A graduate degree",
};

/** Supervisor and manager jobs are usually filled by promotion, so they are not career-change entry points. */
export function isPromotionRole(o: Occupation): boolean {
  return o.code.startsWith("11-") || /supervisor/i.test(o.title);
}

export interface AgeRow {
  slug: string;
  title: string;
  median: number;
  jobZone: number;
  share45: number;
  medianAge: number | null;
  group: boolean;
  workersK: number;
}

const pay = (o: Occupation) => (o.wage && !o.wage.is_group ? o.wage.median : null);

function rows(maxJz: number): AgeRow[] {
  const { careers, all_workers: aw } = ageData();
  return occupations()
    .filter((o) => !o.thin && !isPromotionRole(o))
    .flatMap((o) => {
      const a = careers[o.code];
      const p = pay(o);
      if (!a?.share_45_plus || !p || !o.job_zone) return [];
      if (o.job_zone > maxJz || p < aw.us_median_pay || a.share_45_plus < aw.share_45_plus) return [];
      return [{ slug: o.slug, title: o.title, median: p, jobZone: o.job_zone, share45: a.share_45_plus, medianAge: a.median_age, group: a.group, workersK: a.total_k }];
    })
    .sort((a, b) => b.median - a.median || a.title.localeCompare(b.title));
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function buildAt40() {
  const { all_workers: aw } = ageData();
  const main = rows(3);
  const fast = rows(2);
  const share45 = pct(aw.share_45_plus);
  const top3 = main.slice(0, 3).map((r) => r.title);
  const title = "Career Change at 40: Jobs Where Older Starters Fit In";
  const description = `${main.length} careers you can train for in two years or less that pay above the U.S. median and employ many workers over 45. BLS 2025 data.`;
  const intro = `No, 40 is not too late. The median U.S. worker is ${aw.median_age} years old and ${share45} of workers are 45 or older (BLS, 2025). Below are ${main.length} careers that usually take two years or less to train for, pay more than the U.S. median of ${money(aw.us_median_pay)}, and have at least as many workers over 45 as the workforce as a whole.`;
  const faq: Faq[] = [
    {
      q: "Is 40 too old to change careers?",
      a: `No. The median age of employed Americans is ${aw.median_age}, and ${share45} of workers are 45 or older (BLS Current Population Survey, 2025). At 40 you may have 25 or more working years ahead.`,
    },
    {
      q: "What is a good career to switch to at 40?",
      a: `Careers that pay well, take two years or less to train for and already employ many people over 45. By BLS data, the best-paid of these are ${top3.join(", ")}. The right one depends on your skills: our Career Change Tool ranks careers by how much of your experience carries over.`,
    },
    {
      q: "Can I change careers at 40 without going back to school for years?",
      a: `Yes. ${fast.length} of the careers on this page usually need a year or less of preparation, such as a certificate, an apprenticeship start or on-the-job training.`,
    },
    {
      q: "Where do these numbers come from?",
      a: "Ages: BLS Current Population Survey 2025 annual averages (Table 11b). Pay: BLS Occupational Employment and Wage Statistics, May 2025. Preparation: O*NET 31.0 Job Zones. Supervisor and manager jobs are left out because they are usually filled by promotion.",
    },
  ];
  return { title, description, intro, main, fast, aw, faq };
}
