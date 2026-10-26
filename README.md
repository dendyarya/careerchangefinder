# careerchangefinder.com

Free U.S. career change, career and college-major site built on O*NET 31.0, BLS OEWS May 2025 and the NCES CIP–SOC crosswalk.

- Next.js 16 (App Router, TypeScript strict, Tailwind 4), `output: "standalone"` for the VPS
- Keystatic CMS (GitHub mode) for Guides articles
- No database: the ETL writes JSON into `data/processed` and `data/tests`, bundled at build time
- Runbook and plan: Claude Docs "Runbook & Prompt: careerchangefinder.com"

## Folders

| Folder | What |
|---|---|
| `app/` | Routes. `app/(site)` has the public pages with header and footer; `app/keystatic` and `app/api/keystatic` are the CMS |
| `components/` | Header (mega-menu, phone drawer, search), Footer, AdSlot, Logo |
| `lib/data` | Typed loaders for `data/processed` |
| `lib/scoring` | Test scoring (Interest Profiler, Big Five, Career Match, Career Change Quiz, College Major Quiz) |
| `lib/nav.ts` | Menu bar v4: one source for header, drawer and footer |
| `content/guides` | Guides articles (MDX, written by Keystatic) |
| `data/raw` | Source files (O*NET is downloaded, not committed) |
| `data/processed`, `data/tests` | ETL output used by the site |
| `scripts/etl` | Data build and checks (Python) |
| `docs/` | Design tokens, methodology, tests, data report |

## Run locally

Requires Node 22+ and Python 3.11+ (with `pip install -r scripts/etl/requirements.txt`).

```bash
npm ci
cp .env.example .env.local   # optional; defaults are fine for local work
npm run dev                  # http://localhost:3000, Keystatic at /keystatic (local mode)
```

In development Keystatic saves files straight into `content/guides`. Commit them with git.

## Rebuild the data (ETL)

```bash
python3 scripts/etl/download.py   # O*NET 31.0 zip and NCES crosswalk (BLS files are in data/raw/bls)
npm run etl                       # build.py, build_tests.py, verify.py, verify_tests.py, report.py
```

`verify.py` re-reads the raw files and checks every published value. `verify_tests.py` checks test items word for word against the official files. **If either fails, do not deploy.**

## Checks and build

```bash
npm run check   # typecheck + lint + unit tests
npm run build   # production build (.next/standalone)
```

Standalone run (what the VPS does):

```bash
cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `SITE_ENV` | server | `production` only on the live site. Anything else sends `noindex`. |
| `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | server | Keystatic GitHub mode. Without them `/keystatic` returns 404. |

Never commit `.env*` files or paste secrets anywhere else. See the runbook section "Keamanan website".

## Data licenses

- O*NET 31.0 Database: CC BY 4.0 (attribution in the footer)
- O*NET Interest Profiler Short Form: CC BY-ND 4.0, items and scoring unchanged
- BLS OEWS and NCES crosswalk: public domain
- IPIP items: public domain
- Fonts: Space Grotesk and Manrope, SIL Open Font License (`app/fonts`)
