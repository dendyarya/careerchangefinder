/**
 * "Career change at [age]" pages (30, 40, 50). Lists are filters over data/processed: BLS CPS 2025 age
 * data (situations/age.json), BLS OEWS May 2025 pay and O*NET 31.0 Job Zones. Rules are printed on
 * each page and recomputed by scripts/qa/check_pages_vs_data.py.
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

export const JZ_PREP: Record<number, string> = {
  1: "A few months or less",
  2: "Up to a year",
  3: "1–2 years (training or associate)",
  4: "A bachelor's degree",
  5: "A graduate degree",
};

/**
 * Facts a reader must know before picking a career that the O*NET Job Zone alone hides.
 * Each note cites an official source. Shown under the table and marked in the row.
 */
export const CAREER_NOTES: Record<string, { text: string; sources: { label: string; url: string }[] }> = {
  "53-2012.00": {
    text: "Commercial Pilots need an FAA commercial pilot certificate: at least 250 logged flight hours, an FAA medical exam, and a written and a practical flight test. Many employers ask for 1,000 to 2,000 hours or more, and flight training is costly. Airline pilots must retire at 65 under federal law.",
    sources: [
      { label: "FAA: commercial pilot certificate", url: "https://www.faa.gov/faq/how-do-i-get-commercial-pilot-license-certificate" },
      { label: "BLS Occupational Outlook Handbook: Airline and Commercial Pilots", url: "https://www.bls.gov/ooh/transportation-and-material-moving/airline-and-commercial-pilots.htm" },
    ],
  },
};

/** Supervisor and manager jobs are usually filled by promotion, so they are not career-change entry points. */
export function isPromotionRole(o: Occupation): boolean {
  return o.code.startsWith("11-") || /supervisor/i.test(o.title);
}

type ShareKey = "share_under_35" | "share_45_plus" | "share_55_plus";
export interface AgeRow {
  code: string;
  slug: string;
  title: string;
  median: number;
  jobZone: number;
  share: number;
  medianAge: number | null;
  group: boolean;
  note: boolean;
}

const pay = (o: Occupation) => (o.wage && !o.wage.is_group ? o.wage.median : null);
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function nationalShares() {
  const { all_workers: aw } = ageData();
  const b = aw.bands_k;
  return {
    share_under_35: Math.round(((b["16-19"]! + b["20-24"]! + b["25-34"]!) / aw.total_k) * 1000) / 1000,
    share_45_plus: aw.share_45_plus,
    share_55_plus: aw.share_55_plus,
  } satisfies Record<ShareKey, number>;
}

function rows(maxJz: number, key: ShareKey): AgeRow[] {
  const { careers, all_workers: aw } = ageData();
  const floor = nationalShares()[key];
  return occupations()
    .filter((o) => !o.thin && !isPromotionRole(o))
    .flatMap((o) => {
      const a = careers[o.code];
      const p = pay(o);
      const v = a?.[key];
      if (v == null || !p || !o.job_zone) return [];
      if (o.job_zone > maxJz || p < aw.us_median_pay || v < floor) return [];
      return [
        {
          code: o.code,
          slug: o.slug,
          title: o.title,
          median: p,
          jobZone: o.job_zone,
          share: v,
          medianAge: a!.median_age,
          group: a!.group,
          note: o.code in CAREER_NOTES,
        },
      ];
    })
    .sort((a, b) => b.median - a.median || a.title.localeCompare(b.title));
}

export const AGE_SLUGS = ["at-30", "at-40", "at-50"] as const;
export type AgeSlug = (typeof AGE_SLUGS)[number];

interface AgeConfig {
  age: number;
  key: ShareKey;
  shareLabel: string; // table column
  shareWords: string; // in sentences
  maxJz: number;
  fastJz: number;
  prepWords: string;
  descPrep: string;
  fastWords: string;
  title: string;
}
const CONFIG: Record<AgeSlug, AgeConfig> = {
  "at-30": {
    age: 30,
    key: "share_under_35",
    shareLabel: "Workers under 35",
    shareWords: "workers under 35",
    maxJz: 4,
    fastJz: 3,
    prepWords: "up to a bachelor's degree",
    descPrep: "a bachelor's degree or less",
    fastWords: "two years or less",
    title: "Career Change at 30: Careers Worth Retraining For",
  },
  "at-40": {
    age: 40,
    key: "share_45_plus",
    shareLabel: "Workers 45+",
    shareWords: "workers aged 45 or older",
    maxJz: 3,
    fastJz: 2,
    prepWords: "two years or less",
    descPrep: "two years or less of training",
    fastWords: "a year or less",
    title: "Career Change at 40: Jobs Where Older Starters Fit In",
  },
  "at-50": {
    age: 50,
    key: "share_55_plus",
    shareLabel: "Workers 55+",
    shareWords: "workers aged 55 or older",
    maxJz: 3,
    fastJz: 2,
    prepWords: "two years or less",
    descPrep: "two years or less of training",
    fastWords: "a year or less",
    title: "Career Change at 50: Jobs Where Many Workers Are Over 55",
  },
};

export function buildAgePage(slug: AgeSlug) {
  const c = CONFIG[slug];
  const { all_workers: aw } = ageData();
  const nat = nationalShares();
  const floor = pct(nat[c.key]);
  const main = rows(c.maxJz, c.key);
  const fast = rows(c.fastJz, c.key);
  const notes = main.filter((r) => r.note).map((r) => ({ code: r.code, title: r.title, ...CAREER_NOTES[r.code]! }));
  const top3 = main.slice(0, 3).map((r) => r.title).join(", ");
  const usMedian = money(aw.us_median_pay);
  // the rule, in plural form for the intro and singular form ("Each one …") above the table
  const rulePlural = `usually take ${c.prepWords} to prepare for, pay more than the U.S. median of ${usMedian}, and have at least ${floor} of their ${c.shareWords}, the same share as the whole U.S. workforce`;
  const rule = `usually takes ${c.prepWords} to prepare for, pays more than the U.S. median and has at least ${floor} of its ${c.shareWords}`;
  const yearsTo67 = 67 - c.age;

  const intro: Record<AgeSlug, string> = {
    "at-30": `30 is a good age to change careers: you have work experience and more than ${yearsTo67} working years ahead. ${pct(nat.share_under_35)} of U.S. workers are under 35 (BLS, 2025), so newcomers are common. Below are ${main.length} careers that ${rulePlural}.`,
    "at-40": `No, 40 is not too late. The median U.S. worker is ${aw.median_age} years old and ${pct(nat.share_45_plus)} of workers are 45 or older (BLS, 2025). Below are ${main.length} careers that ${rulePlural}.`,
    "at-50": `Changing careers at 50 is common. ${pct(nat.share_55_plus)} of U.S. workers are 55 or older (BLS, 2025), and at 50 you may have ${yearsTo67 - 2} to ${yearsTo67} working years ahead. Below are ${main.length} careers that ${rulePlural}.`,
  };

  const faq: Record<AgeSlug, Faq[]> = {
    "at-30": [
      { q: "Is 30 too late to change careers?", a: `No. At 30 you likely have more than ${yearsTo67} working years ahead, and ${pct(nat.share_under_35)} of U.S. workers are under 35 (BLS Current Population Survey, 2025).` },
      { q: "Is it worth going back to school at 30?", a: `It can be. A bachelor's degree takes about four years full time, which still leaves more than 30 working years. ${main.filter((r) => r.jobZone === 4).length} careers on this page usually need a bachelor's degree; ${fast.length} need two years or less.` },
      { q: "What careers can I switch to at 30?", a: `By BLS pay data the best-paid careers on this page are ${top3}. Our Career Change Tool ranks careers by how much of your current experience carries over.` },
    ],
    "at-40": [
      { q: "Is 40 too old to change careers?", a: `No. The median age of employed Americans is ${aw.median_age}, and ${pct(nat.share_45_plus)} of workers are 45 or older (BLS Current Population Survey, 2025). At 40 you may have 25 or more working years ahead.` },
      { q: "What is a good career to switch to at 40?", a: `Careers that pay well, take two years or less to train for and already employ many people over 45. By BLS data, the best-paid of these are ${top3}. Our Career Change Tool ranks careers by how much of your experience carries over.` },
      { q: "Can I change careers at 40 without going back to school for years?", a: `Yes. ${fast.length} of the careers on this page usually need a year or less of preparation, such as a certificate, an apprenticeship start or on-the-job training.` },
    ],
    "at-50": [
      { q: "Is 50 too old to change careers?", a: `No. ${pct(nat.share_55_plus)} of U.S. workers are 55 or older, and ${pct(nat.share_45_plus)} are 45 or older (BLS Current Population Survey, 2025).` },
      { q: "What jobs are good for a career change at 50?", a: `Careers that take two years or less to prepare for, pay above the U.S. median and already employ many people over 55. By BLS data the best-paid are ${top3}.` },
      { q: "Can I retrain at 50 without a degree?", a: `Yes. ${fast.length} careers on this page usually need a year or less of preparation, and none needs a bachelor's degree.` },
    ],
  };
  const sourcesFaq: Faq = {
    q: "Where do these numbers come from?",
    a: "Ages: BLS Current Population Survey 2025 annual averages (Table 11b). Pay: BLS Occupational Employment and Wage Statistics, May 2025. Preparation: O*NET 31.0 Job Zones. Supervisor and manager jobs are left out because they are usually filled by promotion.",
  };

  return {
    slug,
    ...c,
    description: `${main.length} careers to start at ${c.age} with ${c.descPrep}, pay above the U.S. median and many ${c.shareWords}. BLS 2025 data.`,
    intro: intro[slug],
    rule,
    main,
    fast,
    notes,
    aw,
    nat,
    faq: [...faq[slug], sourcesFaq],
  };
}
