# Methodology

How careerchangefinder.com turns public data into career matches. This page is the source for the public "How we match careers" page.

## Sources

| Data | Source | License |
|---|---|---|
| Tasks, skills, knowledge, interests, work context, education, Job Zones, related occupations | O*NET 31.0 Database, USDOL/ETA | CC BY 4.0 (attribution required) |
| Pay (national and by state) | BLS Occupational Employment and Wage Statistics, May 2025 | Public domain |
| Majors linked to careers | NCES CIP 2020 to SOC 2018 crosswalk | Public domain |

We do not edit source numbers. Every build is checked by `scripts/etl/verify.py`, which re-reads the raw files and compares every published value (270,904 values in the October 2026 build, 0 differences), including that every "top" list really holds the highest-rated items.

## Which careers get a page

1,016 O*NET occupations are loaded. 875 get a full, indexed page. The other 141 are marked *thin* (noindex, not in the sitemap) because BLS publishes no median pay for them, O*NET has no full profile, or they are "All Other" catch-all groups.

## Match score (0–99)

For a current job A and a possible next job B:

1. **Profile similarity.** Pearson correlation between A and B on O*NET importance ratings, negative values set to 0, weighted:
   - Transferable skills 35%
   - Knowledge 25%
   - Work activities 15%
   - Interests (RIASEC) 15%
2. **Related-occupation bonus**, up to 10 points, when O*NET lists B as related to A (Primary-Short 10, Primary-Long 7, Supplemental 4).
3. **Preparation penalty** from Job Zones (1 = little preparation, 5 = graduate degree):
   - Moving up 1/2/3/4 zones: −5 / −15 / −25 / −30
   - Moving down 1/2/3/4 zones: −3 / −8 / −15 / −20
4. **Pay-drop penalty.** If B's median pay is more than 10% below A's, −0.6 points for each extra percent, up to −25. Higher pay gives no bonus.
5. **Filters.** Long licensed professions (physicians, dentists, lawyers, judges, licensed psychologists and similar) are shown only to people already in the same field. Thin occupations are never shown as targets.

The result is rounded and capped at 0–99. It is our estimate of how much of your current experience carries over. It is not a prediction of success.

### "Jobs for former …" pages

Hub pages (teachers, nurses, and others) use the average profile of the member occupations and the employment-weighted median pay. Careers in the same field, such as other teaching or nursing roles, are listed separately under "Similar roles in the same field", because those pages are about leaving the field.

## Pay

- Pay is the BLS annual median for the matching SOC code. State pages use the BLS state file.
- **Group wages.** Some O*NET occupations share one BLS code with others, such as Clinical Research Coordinators within *Natural Sciences Managers*. Their pay is shown with the label "Pay for the broader BLS group: …". Group pay is **never** used for the "pay change" percentage or in pay rankings. It counts only for the pay-drop penalty, so an inflated group figure cannot raise a career's score.
- BLS can withhold exact figures for very high wages ("#" in its files). The May 2025 file has none for detailed occupations. If a later release has them, we mark the career as top-coded and show the BLS wording instead of a number.
- **Pay change** is (target median − your job's median) ÷ your job's median, rounded to a whole percent. Colors follow the sign: +3% or more green, −3% or less red; the + or − sign is always shown.

## What each "Jobs for Former …" page shows

- **Table:** the 25 best matches in score order (10 shown first). "Extra education" compares Job Zones: "None" when the target usually needs no more preparation than your job; otherwise the target's level (high school diploma, certificate or associate, bachelor's degree, graduate degree).
- **Skills you enjoy:** your job's 8 most important transferable skills (O*NET importance). Picking skills re-orders the list by 60% skill match + 40% the average importance of the picked skills in each target job. The skill match number does not change.
- **Skills to learn:** the skill gaps that appear most often across the top 10 matches. A gap is a transferable skill whose importance in the target is at least 0.25 points higher than in your job.
- **Top 3 moves, up close:** the most common education level and its share of workers, the extra preparation if the Job Zone is higher, a certification note (O*NET Job-Related Professional Certification importance: 3.5+ "often expected", 2.5–3.5 "can help"), on-the-job training, and the hard parts (below).
- **FAQ:** answers are built from the numbers in the table; no outside figures.
- **One page per job:** when a popular page covers a single occupation (for example Registered Nurses → Jobs for Former Nurses), the occupation page redirects to it.

## "Jobs similar to …" pages

The 20 careers with the highest **profile similarity** (step 1 of the match score only): the same weighted correlation of transferable skills, knowledge, work activities and interests, shown as a percentage. There is no related-occupation bonus and no preparation or pay penalty, because this page answers "which jobs are most alike", not "where should I move". Licensed professions are included. "Same group" means the same SOC minor group (first three digits of the SOC code, e.g. 29-1).

- **Similar jobs that pay more:** careers from the 20 with a higher BLS median pay that usually need no more preparation (Job Zone at or below the current job's). Group wages are never compared.
- **Similar jobs that need less preparation:** careers from the 20 with a lower Job Zone.
- **Jobs that can lead here:** careers whose career-change top 25 includes this job (the career-change match score is shown).

## Career listings ("Careers by …")

Every list uses careers with a full page only. The rule is printed on each page.

| List | Who is included | Order |
|---|---|---|
| Industry (22) | SOC major group (first two digits) | BLS employment, highest first |
| Education (4) | Most common required education reported to O*NET: no degree = categories 1–2, certificate or associate = 3–5, bachelor's = 6–7, master's = 8 | BLS median pay (group wages last) |
| Personality: introverts, extroverts, detail-oriented, hate routine, competitive, low stress, high pressure | Percentile of an O*NET Work Context or Work Styles value (Contact With Others, Attention to Detail + Dependability, Importance of Repeating Same Tasks, Level of Competition, Time Pressure). "Low" lists use Job Zone 3+ only | That value, then pay; top 50 |
| Personality: creative, hands-on, helping people | O*NET interest score (Artistic, Realistic, Social, 1–7) | That score, then pay; top 50 |
| Holland code (6) | Careers whose highest interest score is that area | That score |
| Salary (2) | Careers with their own BLS median (no group wages); "without a degree" adds education categories 1–2 | BLS median pay; top 50 |

Every listing and every "Jobs similar to" row is re-checked against the data after each build (`scripts/qa/check_pages_vs_data.py`), with the listing order recomputed from the rules above.

## Salary pages

`/careers/[job]/salary` lists every state BLS publishes for the job (BLS OEWS May 2025 state file), highest median first, with the 10th and 90th percentiles, employment and the difference from the national median. `/careers/[job]/salary/[state]` shows one state, its rank, the states ranked just above and below, and the state median of up to 6 similar careers. Values BLS does not publish (`*`, or `#` for amounts above its highest published figure) are shown as "Not published". Group wages carry the broader BLS group label. Pay is not adjusted for living costs. State pages with fewer than 5,000 jobs are noindex at launch (7,244 indexed); the floor will be lowered to 1,000 if Search Console shows these pages are indexed and get impressions. Small state estimates have much higher BLS sampling error (median relative standard error 14.7% under 1,000 jobs vs 6.4% above). State pages are built on first visit and kept in memory; a sample of them is checked against the data in every deploy (`scripts/qa/check_state_pages.py`).

## "Career change at …" and "Career change to …" pages

Extra sources, downloaded by hand from bls.gov (kept in `data/raw/bls`):

- **Worker age:** BLS Current Population Survey, 2025 annual averages, Table 11b (employed people by detailed occupation and age). 2025 is an 11-month average: October 2025 was not collected. CPS occupations carry titles, not SOC codes. They are matched to BLS OEWS SOC titles word for word (case and punctuation ignored); 18 titles that differ are mapped by hand in `scripts/etl/build_situations.py`. "Other …" catch-all rows are not used, except four clearly defined ones (other physicians, other mathematical science, other drafters, other engineering technicians). Shares are shown only where the CPS base is at least 50,000 workers, the same floor BLS uses for median age. When the CPS row covers several jobs the page says "Broader group".
- **Government jobs:** BLS OEWS May 2025, national cross-industry estimates by ownership (federal, state, local government and private).

**Career change at 30, 40 and 50.** Careers that pay at least the U.S. median for all occupations (BLS OEWS May 2025) and have at least the national share of workers in the age group that matters for that page. Supervisor and manager jobs are left out because they are usually filled by promotion. Highest median pay first.

| Page | Preparation (O*NET Job Zone) | Age group (at least the U.S. share) | "Faster options" |
|---|---|---|---|
| at 30 | up to a bachelor's degree (≤4) | workers under 35 | Job Zone ≤3 |
| at 40 | two years or less (≤3) | workers 45 or older | Job Zone ≤2 |
| at 50 | two years or less (≤3) | workers 55 or older | Job Zone ≤2 |

**Career change to government jobs.** BLS OEWS May 2025 national estimates by ownership (government includes public schools and hospitals and the U.S. Postal Service). Main list: careers with at least 10,000 government jobs, most jobs first, with government and private medians and the difference. "Government pays at least 10% more": government median at least 10% above private, both with at least 5,000 jobs. "Biggest federal careers": at least 5,000 federal jobs. Careers that only have a broader BLS group wage, supervisors and managers are left out.

**Career change to remote work.** "Can mostly be done from home" is our estimate: the method of Dingel & Neiman (2020, Journal of Public Economics 189) applied to O*NET 31.0. A career is not remote-friendly if any of these hold: e-mail used less than monthly (CX < 3); dealing with violent people, exposure to disease, or minor burns and cuts at least weekly (CX ≥ 4); walking or running, or wearing common or specialized protective equipment, more than half the time (CX ≥ 4); most workers outdoors every day (CXP category 5 > 50%); or any of eight work activities is very important (importance ≥ 4): general physical activities, handling objects, controlling machines, operating vehicles, working directly with the public, repairing mechanical or electronic equipment, inspecting equipment. Across U.S. jobs this gives 36.4% (employment-weighted), close to the 37% Dingel & Neiman report. The page lists remote-friendly careers that pay above the U.S. median, excluding supervisors, managers and long licensed professions, ordered by how many workers in that field actually teleworked in 2025 (BLS CPS 2025 annual averages, Table 62, by occupation group), then pay. It is an estimate of what the work allows, not a count of remote job ads.

**Career change to tech, healthcare, nursing and skilled trades.** Fixed SOC rules: tech = computer occupations (SOC 15-1200) and data scientists (15-2051); healthcare = SOC 29 and 31; nursing = nursing assistants, LPNs/LVNs, registered nurses and their O*NET specialties, nurse practitioners, nurse anesthetists, nurse midwives and nursing instructors; skilled trades = SOC 47-2000, 47-4000 and 49. Each page lists every career in the field (most BLS jobs first), the "ways in" (Job Zone 3 or lower, no supervisors or managers, highest pay first), and the 20 jobs outside the field whose career-change top 25 includes a field career with the highest match score. The nursing page adds the licensing path for each step from the BLS Occupational Outlook Handbook.

**"Read before you start" notes.** Where a career's Job Zone hides a large hurdle, the page adds a short note from an official source. Current notes: Commercial Pilots (FAA certificate requirements and costs, airline retirement at 65; sources FAA and the BLS Occupational Outlook Handbook).

Every value is checked against the raw files by `scripts/etl/verify_situations.py`, and the page's lists are recomputed from these rules after each build.

## Career Change Tool

The same data as the pages above. Filters: extra education (any, none, up to a certificate or associate, up to a bachelor's degree) and pay (any, no drop bigger than 10%, pays more). Careers with only a broader BLS group wage are left out of the pay filters.

## Big Five test and trait pages

Scoring and the trait-to-career mapping are described in full on the tests page (docs/tests.md). In short: each trait is linked to two O*NET Work Styles, and careers are ranked by how much those styles matter in the job. Lists for the low end of a trait include only careers that usually need training (Job Zone 3+).

## Other fields

- **First step:** O*NET Education, Training and Experience (most common category and its share of workers), plus the Job Zone label.
- **The hard parts:** O*NET Work Context factors rated 3.5 or higher on a 1–5 scale (for example, time pressure or exposure to disease).
- **Majors:** the NCES crosswalk links majors (CIP codes) to careers (SOC codes).
- **Work styles that stand out:** O*NET Work Styles with a Distinctiveness Rank (DR) above 0, highest first (ties broken by the Impact scale, WI), up to 5.

## Limits

- O*NET ratings describe a typical worker, not you.
- Pay is a national or state median. It is not an offer and excludes benefits.
- Some O*NET Job Zones look surprising (for example, a supervisor role at Job Zone 2). We show them as published.

## Attribution

This site incorporates information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET is a trademark of USDOL/ETA. USDOL/ETA has not approved, endorsed, or tested these modifications.
