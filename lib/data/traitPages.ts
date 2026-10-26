import "server-only";
import fs from "node:fs";
import path from "node:path";

export interface TraitPageData {
  trait: string;
  end: "high" | "low";
  styles: string[];
  min_job_zone: number | null;
  careers: { slug: string; title: string; median: number | null; job_zone: number | null; percentile: number }[];
  majors: { slug: string; title: string; value: number }[];
}

let cache: Record<string, TraitPageData> | null = null;
export function traitPages(): Record<string, TraitPageData> {
  cache ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "tests", "trait-pages.json"), "utf8"));
  return cache!;
}
