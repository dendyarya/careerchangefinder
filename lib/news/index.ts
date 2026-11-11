/**
 * News articles from content/news (written by Keystatic). Same safety rules as Guides: bodies are plain
 * Markdown (CommonMark + GFM), never MDX code. Times are stored and served in UTC.
 * Drafts are visible only where the site is not indexable (local, staging).
 */
import "server-only";
import { createReader } from "@keystatic/core/reader";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import keystaticConfig from "@/keystatic.config";
import { isPublished } from "@/lib/published";
import { SITE } from "@/lib/site";

const reader = createReader(process.cwd(), keystaticConfig);

export interface NewsMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  /** ISO 8601 in UTC, e.g. 2026-11-11T12:00:00Z */
  publishedAt: string;
  updatedAt: string | null;
  heroImage: string;
  heroImageAlt: string;
  heroImageCaption: string;
  draft: boolean;
}

/** Keystatic stores "YYYY-MM-DDTHH:mm" without a zone; we treat it as UTC. */
export const utc = (v: string) => (/[zZ]|[+-]\d\d:\d\d$/.test(v) ? new Date(v) : new Date(`${v}:00Z`)).toISOString().replace(".000Z", "Z");

export async function listNews(): Promise<NewsMeta[]> {
  const all = await reader.collections.news.all();
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      description: entry.description,
      author: entry.author,
      publishedAt: entry.publishedAt ? utc(entry.publishedAt) : "",
      updatedAt: entry.updatedAt ? utc(entry.updatedAt) : null,
      heroImage: entry.heroImage ?? "",
      heroImageAlt: entry.heroImageAlt ?? "",
      heroImageCaption: entry.heroImageCaption ?? "",
      draft: entry.draft,
    }))
    .filter((n) => n.publishedAt && (!n.draft || !SITE.indexable) && isPublished("news", n.slug))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getNews(slug: string) {
  const entry = await reader.collections.news.read(slug);
  if (!entry || (entry.draft && SITE.indexable)) return null;
  const meta = (await listNews()).find((n) => n.slug === slug);
  if (!meta) return null;
  const source = await entry.body();
  const { default: Content } = await evaluate(source, { ...runtime, format: "md", remarkPlugins: [remarkGfm] });
  const words = source.split(/\s+/).filter(Boolean).length;
  return { meta, Content, words, minutes: Math.max(1, Math.round(words / 230)) };
}

/** "November 11, 2026, 7:00 a.m. ET" */
export function newsTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })
    .replace("AM", "a.m.")
    .replace("PM", "p.m.");
  return `${date}, ${time} ET`;
}

export const newsDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
