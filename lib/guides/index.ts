/**
 * Guides articles from content/guides (written by Keystatic).
 * Bodies are compiled as plain Markdown (CommonMark + GFM), not MDX: raw HTML, <script>, imports and
 * JS expressions in an article are shown as text and never run (runbook: Keamanan website, part 3).
 * Drafts are visible only where the site is not indexable (local, staging).
 */
import "server-only";
import { createReader } from "@keystatic/core/reader";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import keystaticConfig from "@/keystatic.config";
import { SITE } from "@/lib/site";
import { h2s } from "./headings";

const reader = createReader(process.cwd(), keystaticConfig);

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt: string | null;
  category: "career-change" | "choosing-a-major";
  heroImage: string | null;
  heroImageAlt: string;
  draft: boolean;
}

export async function listGuides(): Promise<GuideMeta[]> {
  const all = await reader.collections.guides.all();
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      description: entry.description,
      author: entry.author,
      publishedAt: entry.publishedAt ?? "",
      updatedAt: entry.updatedAt ?? null,
      category: entry.category as GuideMeta["category"],
      heroImage: entry.heroImage ?? null,
      heroImageAlt: entry.heroImageAlt ?? "",
      draft: entry.draft,
    }))
    .filter((g) => !g.draft || !SITE.indexable)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getGuide(slug: string) {
  const entry = await reader.collections.guides.read(slug);
  if (!entry || (entry.draft && SITE.indexable)) return null;
  const source = await entry.body();
  const { default: Content } = await evaluate(source, { ...runtime, format: "md", remarkPlugins: [remarkGfm] });
  const words = source.split(/\s+/).filter(Boolean).length;
  return {
    meta: (await listGuides()).find((g) => g.slug === slug)!,
    Content,
    toc: h2s(source),
    minutes: Math.max(1, Math.round(words / 230)),
  };
}
