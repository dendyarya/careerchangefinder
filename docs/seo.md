# Technical SEO (Tahap 6)

| Item | Where | Notes |
|---|---|---|
| Sitemap index | `/sitemap.xml` (`app/sitemap.xml/route.ts`) | Lists 7 section sitemaps under `/sitemaps/*.xml` (`lib/sitemap.ts`). Only published, indexed pages: no thin profiles; state salary pages only with 5,000+ jobs. `lastmod` = data build date, or the guide's updated/published date. Max 50,000 URLs per file (build fails above). |
| robots.txt | `app/robots.ts` | Production: allow all, block `/keystatic` and `/api/`, list the sitemap. Any other environment: `Disallow: /` plus `X-Robots-Tag: noindex` (next.config.ts) and `noindex` meta. |
| Staged publishing | `config/published.json`, `lib/published.ts` | Per section `"all"` or a list of slugs. Unpublished pages are not generated (404), are left out of the sitemap and of index pages. |
| Structured data | `app/(site)/layout.tsx` and page templates | Organization + WebSite on every page (no SearchAction: Google retired the sitelinks search box in Nov 2024). BreadcrumbList on every page except home, Occupation + estimatedSalary on profiles, Article on guides and situation pages, FAQPage where a FAQ is shown, ItemList and Dataset on list pages. |
| Open Graph images | `/og/<page path>.png` (`app/og/[...path]/route.tsx`, `lib/ogCards.ts`), `/og-default.png` | 1200×630, page title and the main number (for example median pay). Built on first request and kept in memory. Only real pages resolve; other paths are 404. Fonts: Space Grotesk and Manrope (SIL OFL), `lib/og-fonts`. |
| llms.txt | `/llms.txt`, `/llms-full.txt` | Site summary, data sources, main sections; the full file lists every indexed career with median pay and preparation. |
| Redirects | `proxy.ts`, Next defaults | `www.` → apex (301), upper case → lower case (301), trailing slash removed (308). |
| Icons | `app/icon.svg`, `app/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png` | From the logo mark. |

## Tests

- `scripts/qa/audit_html.py` (every built page): one H1, title present and unique, description 70–160 characters, canonical, og:image, valid JSON-LD with the types above, no "undefined"/"NaN". Titles over 60 characters are reported as warnings: they are career names that are long in O*NET itself (for example "Low Vision Therapists, Orientation and Mobility Specialists, and Vision Rehabilitation Therapists"). For those, the page type comes first and `lib/seoName.ts` shortens standard patterns ("Setters, Operators, and Tenders" → "Operators").
- `scripts/qa/check_sitemaps.py` (running server): every sitemap URL answers 200 without a redirect, no thin or under-floor page is listed, and with `--production` no listed page is noindex.
