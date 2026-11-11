# Daily news task (runbook)

A scheduled task runs once a day at a different time on each weekday. It checks for new official U.S.
labor and pay data and, **only when there is a new release**, writes one news article and publishes it.
On a day with no new release it changes nothing. The site owner approved this on Nov 11, 2026:
"check every day, write only when there is a release", publish times vary by weekday, every push to `main`
deploys production.

## 1. Set up the session

```bash
cd /home/claude/careerchangefinder 2>/dev/null || git clone https://github.com/dendyarya/careerchangefinder /home/claude/careerchangefinder
cd /home/claude/careerchangefinder
git fetch origin && git checkout -B main origin/main
git merge-base --is-ancestor origin/staging origin/main || echo "STOP: staging has commits main does not have"
npm ci
```

If `staging` is ahead of `main` (someone saved in the CMS), stop and report instead of publishing.

## 2. Is there a new release?

Covered sources, in order of priority. A release counts if it came out **in the last 36 hours** and no
article covers it yet (see the newest files in `content/news` and their **Sources:** line):

| Release | Agency | Usual timing |
| --- | --- | --- |
| The Employment Situation (jobs report) | BLS | first Friday, 8:30 a.m. ET |
| Job Openings and Labor Turnover Survey (JOLTS) | BLS | early in the month, 10:00 a.m. ET |
| Consumer Price Index and Real Earnings | BLS | mid-month, 8:30 a.m. ET |
| State Employment and Unemployment | BLS | mid to late month |
| Employment Cost Index | BLS | quarterly |
| Unemployment Insurance Weekly Claims | DOL | every Thursday, 8:30 a.m. ET |
| Personal Income by State, Regional Price Parities | BEA | as scheduled |
| O*NET database releases | DOL / National Center for O*NET Development | a few times a year |

Use WebSearch to find the release, then WebFetch the **official page** (bls.gov, dol.gov, bea.gov,
census.gov, onetcenter.org). Never take numbers from news outlets or blogs; other outlets may only be linked
as "also reported by". If several releases are new, write about the most important one (jobs report >
JOLTS > CPI/real earnings > state data > weekly claims). One article per day at most.

If nothing is new: stop, change nothing, and report "no new release today".

## 3. Write the article (content/news/<slug>.mdx)

Front matter (copy an existing article):

- `title`: 40–70 characters if possible (110 max). Plain, specific, with the key number. No clickbait.
- `description`: 70–160 characters, the news in one sentence plus why it matters.
- `author`: `Career Change Finder News Desk` (never an invented person).
- `publishedAt`: the **current UTC time** when you publish, `YYYY-MM-DDTHH:MM`. Never backdate or postdate.
- `heroImage`: `/images/news/<slug>.png`, `heroImageAlt` describing every number in the chart,
  `heroImageCaption`: `Chart: Career Change Finder. Data: <agency>, <release>, <period>.`
- `draft: false`.

Body (Markdown only, 450–800 words):

1. Lead paragraph: what happened, the key number, who reported it and when (day and date).
2. Detail: the main figures, with revisions if any. A small table helps.
3. **What it means for career changers**: link 3–6 career pages (`/careers/<slug>`) with their BLS May 2025
   median pay, taken from `data/processed/occupations.json` (`wage.median`, skip `thin` careers and say
   "for the broader group" when `wage.is_group` is true). Link a tool or guide that helps (`/career-change/tool`,
   `/guides/...`, `/research/...`) and earlier news when relevant.
4. What comes next: the date of the next release if the agency lists it.
5. Last line: `**Sources:** <agency>, [<release name, period>](<official URL>) (released <date>); ...`
   The first link must be the official release (.gov).

Rules: every number must appear in the official release or in our data; state the reference period;
no predictions, no investment advice, no political opinion; no quotes unless copied word for word from the
release with quotation marks; US English; `##` headings only (never `#`).

## 4. Make the lead image

Write `content/news-charts/<slug>.json` (see the existing ones: `kicker`, `title`, `subtitle`, `unit` =
`jobs` | `pct` | `usd` | `millions`, 3–8 `bars`, `source`, optional `note`), then:

```bash
node scripts/news/render_charts.cjs <slug>
```

Open the PNG with Read and check that nothing overlaps or is cut off.

## 5. Check

```bash
python3 scripts/qa/check_news.py --new <slug>
npm run typecheck && npm run lint
npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
(cd .next/standalone && PORT=3457 HOSTNAME=127.0.0.1 nohup node server.js >/dev/null 2>&1 &)
npm run qa
python3 scripts/qa/check_sitemaps.py http://127.0.0.1:3457
```

All must pass with 0 errors. Fix and re-run; if a check cannot be fixed, do not publish.
`publishedAt` must still be within 6 hours of now when you commit (update it if the checks took long).

## 6. Publish

```bash
git add content/news/<slug>.mdx content/news-charts/<slug>.json public/images/news/<slug>.png
git -c user.name="dendyarya" -c user.email="dendyarya@users.noreply.github.com" commit -m "News: <headline>

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main:main && git push origin main:staging
```

Pushing `main` deploys production (about 10 minutes). Then report, in Indonesian, the headline, the link
`https://careerchangefinder.com/news/<slug>`, and remind the owner to request indexing in Search Console.
Never force-push, never rewrite history, never change code in this task, only the three files above.
