# Tests: sources, licenses, scoring, limits

All tests run in the browser. Answers are not sent to a server. Data lives in `data/tests`, scoring in `lib/scoring`, unit tests in `lib/scoring/__tests__` (`npm test`). Item wording is checked against the saved official files by `scripts/etl/verify_tests.py`.

## 1. Free Career Test

Two parts, shown as two separate results.

### Part A: O*NET Interest Profiler Short Form (official)

| | |
|---|---|
| Source | https://www.onetcenter.org/IPSF.html, items from `Interest_Profiler.pdf` (saved in `data/raw/tests`) |
| Manual | O*NET Interest Profiler Manual (2021), chapters 3 and 7 |
| License | CC BY-ND 4.0 (Option 1 of the O*NET Career Exploration Tools license: copy without changes) |
| Items | 60 work activities, 10 per RIASEC area, official wording |
| Answers | 0 Strongly Dislike, 1 Dislike, 2 Unsure, 3 Like, 4 Strongly Like (computerized Short Form) |
| Order | Two items per area in the order R, I, A, S, E, C, repeated five times. This follows the official form's item sequence and the Manual's rule that areas are presented in R-I-A-S-E-C order. |

**Scoring (Manual ch. 3):** sum per area, 0–40. The three highest areas are the interest code. Ties are shown as ties, and the user picks, as the official form says.

**Career links (Manual ch. 7):** Pearson r between the user's six scores and each career's O*NET Interest profile.
- Best Fit: r ≥ .729 (p < .05, one-tailed, N = 6)
- Great Fit: r ≥ .608 (p < .10)
- Good Fit: r ≥ 0
- Grouped by Job Zone, 10 per Job Zone, sorted by fit, then A–Z.

If every answer is Strongly Dislike, the official retake message is shown.

**Required credit:** "This page includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY-ND 4.0 license. O*NET® is a trademark of USDOL/ETA." Link to https://www.onetcenter.org/license_tools.html.

**Do not:**
- change item wording, add or remove items, or change the scale labels or scoring;
- call our combined ranking "Interest Profiler results".

Optional: register the use at https://www.onetcenter.org/register.

### Part B: Career Match (our questions)

13 questions about the workday you want. Each answer is a target from 0 to 1, compared with the career's percentile among the 875 careers that have full pages.

| Question | Data used |
|---|---|
| Contact with people, serving the public, leading others, outdoors, desk vs. moving, deadlines, physical risk, freedom to decide, routine vs. variety | O*NET Work Context (CX scale, 1–5) |
| Regular schedule, more than 40 hours | O*NET Work Context categories (% of workers) |
| Education you are willing to do | Job Zone (used as a filter) |
| Importance of pay | BLS median pay. Group wages are left out. |

**Scoring:**
- Fit for each question = 1 − |target − percentile|.
- "Doesn't matter" counts 0. "Pay very important" counts 1.5.
- Career Match = weighted mean of the fits, from 0 to 100.

**Our combined ranking:** 60% interest fit (Interest Profiler r, negative values set to 0) plus 40% Career Match. Careers above the chosen Job Zone are left out. This ranking is ours and is labelled that way.

## 2. Big Five Personality Test

| | |
|---|---|
| Source | IPIP Big-Five Factor Markers, 50-item sample questionnaire, https://ipip.ori.org/new_ipip-50-item-scale.htm |
| License | Public domain (the IPIP site allows any use, including edits). We keep the official wording and order. |
| Answers | 1 Very Inaccurate to 5 Very Accurate |
| Factors | Extraversion, Agreeableness, Conscientiousness, Emotional Stability, Intellect/Imagination (Openness) |

**Scoring (IPIP scoring instructions):**
- +keyed items count 1–5. −keyed items count 6 minus the answer.
- Sum of the 10 items per factor gives a score from 10 to 50.
- Bands: low 10–23, medium 24–36, high 37–50. The bands are equal thirds of the possible range, **not population norms**, and the results page says so.

We do not use the name "NEO", MBTI types, or any clinical wording.

## 3. College Major Quiz

- Uses all 60 Interest Profiler items, plus the 20 IPIP items for Openness and Conscientiousness.
- **Major profile:** the average O*NET Interest profile and work-style values of the careers that the NCES CIP–SOC crosswalk links to that major.
  - Openness ↔ O*NET Work Styles Intellectual Curiosity and Innovation.
  - Conscientiousness ↔ O*NET Work Styles Attention to Detail and Dependability.
  - Both use the Impact scale (WI), turned into percentiles.
- **Score:**
  - 70% interest fit, 15% Openness fit, 15% Conscientiousness fit.
  - The score is then multiplied by n / (n + 1), where n is the number of linked careers. This keeps a major linked to only one career from ranking first on a thin profile.
  - The top 15 majors are shown.

## 4. Career Change Readiness Quiz (our questions)

10 questions about money, time, support, target clarity, research, skills, training, health insurance and resume. Each answer scores 0–3 points, for a total of 0–30.

| Points | Level |
|---|---|
| 0–13 | Plan first |
| 14–22 | Getting ready |
| 23–30 | Ready to move |

Any answer worth 0 or 1 adds its tip to the action plan. This is a planning checklist, not a scientific test, and the page says so.

## 5. Big Five Facets Test (phase 4)

Not built yet. Planned: IPIP-NEO-120 items (public domain). It must not be called "NEO" on the site.

## Limits shown on every results page

- These tools help you explore. They are not a diagnosis, a hiring test, or career, financial or psychological advice.
- Career data describes typical workers (O*NET) and median pay (BLS, May 2025), not a job offer.
- Our own questions (Career Match, Career Change Quiz) have not been scientifically validated.
