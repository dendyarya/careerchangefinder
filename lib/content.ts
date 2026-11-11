/**
 * Written content per page (runbook Tahap 7): content/generated/<template>/<slug>.json.
 * Every text is checked by scripts/qa/check_content.py (numbers must come from the page data, banned
 * phrases, overlap with other pages) and reviewed by a person. On the production site only texts with
 * status "approved" are shown; staging and local show drafts too, so they can be reviewed in place.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Faq } from "@/components/page/Common";
import { SITE } from "@/lib/site";

export type Template = "from" | "careers" | "situations" | "similar";

export interface FromContent {
  status: "draft" | "approved";
  intro: string;
  why_it_works: string;
  tips: string[];
  faq: Faq[];
}

/** "Jobs Similar to [job]": a written intro, what the similar jobs share, and two extra FAQ answers. */
export interface SimilarContent {
  status: "draft" | "approved";
  intro: string;
  shared: string;
  faq: Faq[];
}

/** Career profile (/careers/[slug]): a written overview, a note on pay, and four FAQ answers. */
export interface CareerContent {
  status: "draft" | "approved";
  overview: string;
  pay: string;
  faq: Faq[];
}

const DIR = path.join(process.cwd(), "content", "generated");

export function readContent<T extends { status: string }>(template: Template, slug: string): T | null {
  const f = path.join(DIR, template, `${slug}.json`);
  if (!fs.existsSync(f)) return null;
  const c = JSON.parse(fs.readFileSync(f, "utf8")) as T;
  if (SITE.indexable && c.status !== "approved") return null;
  return c;
}
