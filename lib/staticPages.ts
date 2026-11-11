/**
 * Static site pages (Tahap 7F). Bodies are plain Markdown (CommonMark + GFM, no MDX, so nothing in them
 * can run as code): content/pages/<slug>.md, except Methodology, whose source is docs/methodology.md so
 * the public page and the project's method notes can never drift apart.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { h2s } from "@/lib/guides/headings";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");
const DOCS_DIR = path.join(process.cwd(), "docs");

export interface StaticPageConfig {
  title: string; // <title>, 30–60 characters with the site name where possible
  h1: [before: string, highlight: string];
  description: string;
  /** "pages/<name>.md" (content/pages) or "docs/<name>.md" */
  file: `pages/${string}.md` | `docs/${string}.md`;
  /** schema.org type of the page */
  type: "AboutPage" | "ContactPage" | "WebPage";
  toc?: boolean;
}

export const STATIC_PAGES = {
  about: {
    title: "About Career Change Finder",
    h1: ["About Career ", "Change Finder"],
    description:
      "Career Change Finder is a free, independent site that matches careers by skills and pay with O*NET and BLS data. Who we are and how the site is paid for.",
    file: "pages/about.md",
    type: "AboutPage",
  },
  methodology: {
    title: "Methodology: How We Match Careers",
    h1: ["How we match ", "careers"],
    description:
      "How our career match scores, pay comparisons and career lists are calculated from O*NET 31.0 and BLS 2025 data, with every rule and every limit written out.",
    file: "docs/methodology.md",
    type: "WebPage",
    toc: true,
  },
  "data-sources": {
    title: "Data Sources & Licenses",
    h1: ["Data sources & ", "licenses"],
    description:
      "Every data source behind Career Change Finder: O*NET 31.0 (CC BY 4.0), the O*NET Interest Profiler (CC BY-ND 4.0), IPIP, BLS and NCES, with required credits.",
    file: "pages/data-sources.md",
    type: "WebPage",
  },
  contact: {
    title: "Contact Us",
    h1: ["Contact ", "us"],
    description:
      "Contact Career Change Finder by email to report a data error, a broken page or a privacy question. For free one-on-one career help, find an American Job Center.",
    file: "pages/contact.md",
    type: "ContactPage",
  },
  privacy: {
    title: "Privacy Policy",
    h1: ["Privacy ", "policy"],
    description:
      "What Career Change Finder collects, how ads, analytics and affiliate links use cookies, and how to opt out. Test answers stay in your browser.",
    file: "pages/privacy.md",
    type: "WebPage",
  },
  terms: {
    title: "Terms of Use",
    h1: ["Terms of ", "use"],
    description:
      "The rules for using Career Change Finder: what the site offers, how you may use its content, data licenses, ads, affiliate links and our liability limits.",
    file: "pages/terms.md",
    type: "WebPage",
  },
  disclaimer: {
    title: "Disclaimer",
    h1: ["", "Disclaimer"],
    description:
      "Career Change Finder gives general information, not career, financial or legal advice. What our pay data, match scores and test results can and cannot tell you.",
    file: "pages/disclaimer.md",
    type: "WebPage",
  },
  "editorial-policy": {
    title: "Editorial Policy & Corrections",
    h1: ["Editorial policy & ", "corrections"],
    description:
      "How Career Change Finder reports news and research: sources, fact checks, use of AI tools, independence from advertisers, and how we correct errors.",
    file: "pages/editorial-policy.md",
    type: "WebPage",
    toc: true,
  },
  alternatives: {
    title: "My Next Move & CareerExplorer Alternatives (Free)",
    h1: ["Free alternatives to My Next Move and ", "CareerExplorer"],
    description:
      "Free alternatives to My Next Move and CareerExplorer compared: cost, sign-up, test length and career data, plus Truity and 123test. Pick the right career test.",
    file: "pages/alternatives.md",
    type: "WebPage",
  },
} satisfies Record<string, StaticPageConfig>;

export type StaticSlug = keyof typeof STATIC_PAGES;
export const STATIC_SLUGS = Object.keys(STATIC_PAGES) as StaticSlug[];

export async function loadStaticPage(slug: StaticSlug) {
  const cfg: StaticPageConfig = STATIC_PAGES[slug];
  const [dir, name] = cfg.file.split("/") as ["pages" | "docs", string];
  const source = fs.readFileSync(path.join(dir === "docs" ? DOCS_DIR : PAGES_DIR, name), "utf8");
  const { default: Content } = await evaluate(source, { ...runtime, format: "md", remarkPlugins: [remarkGfm] });
  return { cfg, Content, toc: cfg.toc ? h2s(source) : [] };
}
