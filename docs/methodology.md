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
- BLS does not publish exact figures for some very high wages (shown as "#" in the BLS files). We mark these as top-coded and show the BLS wording, not a number.

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
