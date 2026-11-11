"""Spot-check the on-demand (ISR) state salary pages on a running server.

Usage: python3 scripts/qa/check_state_pages.py http://127.0.0.1:3210 [sample=300]
Checks a seeded random sample plus edge cases (p90 or employment not published, group wages),
unknown states and thin careers (must 404), and robots noindex for small state employment.
"""
import html
import json
import math
import pathlib
import random
import re
import sys
import urllib.request
import urllib.error

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / "data" / "processed"
BASE = sys.argv[1].rstrip("/")
N = int(sys.argv[2]) if len(sys.argv) > 2 else 300
MIN_EMP = 5000  # keep in sync with STATE_INDEX_MIN_EMPLOYMENT in lib/salary.ts
MAX_RSE = 25  # keep in sync with STATE_INDEX_MAX_RSE in lib/salary.ts
TOTALS = json.loads((P / "state_totals.json").read_text())
errors, checked = [], 0


def get(path):
    req = urllib.request.Request(BASE + path)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, ""


def money(n):
    return "Not published" if n is None else f"${n:,}"


def pct(n):
    return "—" if n is None else (f"+{n}%" if n > 0 else (f"−{abs(n)}%" if n < 0 else "0%"))


def text(s):
    return re.sub(r"(\d) %", r"\1%", re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip())


slug_of = lambda name: re.sub(r"[^a-z]+", "-", name.lower())
occ = {o["slug"]: o for o in json.loads((P / "occupations.json").read_text())}
pairs, edge = [], []
for slug, o in occ.items():
    f = P / "wages" / f"{slug}.json"
    if o["thin"] or not o["wage"] or not f.exists():
        continue
    for s in json.loads(f.read_text())["states"]:
        pairs.append((slug, s))
        if s["p90"] is None or s["employment"] is None or o["wage"]["is_group"] and len(edge) < 40:
            edge.append((slug, s))
random.seed(31)
sample = random.sample(pairs, min(N, len(pairs))) + edge[:60]
for slug, s in sample:
    o = occ[slug]
    code, page = get(f"/careers/{slug}/salary/{slug_of(s['state'])}")
    if code != 200:
        errors.append(f"{slug}/{s['abbr']}: HTTP {code}")
        continue
    t = text(page)
    nat = o["wage"]["median"]
    vs = math.floor((s["median"] - nat) / nat * 100 + 0.5)
    states = json.loads((P / "wages" / f"{slug}.json").read_text())["states"]
    rank = next(i for i, x in enumerate(states) if x["abbr"] == s["abbr"]) + 1
    tot = TOTALS[s["abbr"]]
    vs_all = math.floor((s["median"] - tot["median"]) / tot["median"] * 100 + 0.5)
    expect = [f"Median pay {money(s['median'])}", f"vs. U.S. median {pct(vs)} ({money(nat)})",
              f"vs. all jobs in {s['abbr']} {pct(vs_all)} ({money(tot['median'])})",
              "Hourly median " + ("Not published" if s["hourly_median"] is None else f"${s['hourly_median']:.2f}"),
              f"Pay rank among states {rank} of {len(states)}",
              "Jobs in the state " + ("Not published" if s["employment"] is None else f"{s['employment']:,}"),
              f"Lowest 10% {money(s['p10'])}", f"25th percentile {money(s['p25'])}",
              f"75th percentile {money(s['p75'])}", f"Top 10% {money(s['p90'])}"]
    if s["jobs_per_1000"] is not None:
        expect.append(f"{str(s['jobs_per_1000']).removesuffix('.0')} of every 1,000 jobs")
    if s["lq"] is not None:
        expect.append(f"location quotient {s['lq']:.2f}")
    # "Close careers that pay more": recomputed with the study rules (own pay, Job Zone, no managers, >= 10%)
    trf = P / "transitions" / f"{slug}.json"
    if not o["wage"]["is_group"] and trf.exists():
        tr = json.loads(trf.read_text())
        better = []
        for mv in tr["top"][:25]:
            to = occ.get(mv["slug"])
            if mv["wage_is_group"] or mv["code"].startswith("11-") or "supervisor" in mv["title"].lower():
                continue
            if not to or to["thin"] or not to["wage"]:
                continue
            if mv["job_zone"] and tr["job_zone"] and mv["job_zone"] > tr["job_zone"]:
                continue
            wf = P / "wages" / f"{mv['slug']}.json"
            ps = next((x for x in json.loads(wf.read_text())["states"] if x["abbr"] == s["abbr"]), None) if wf.exists() else None
            if ps and ps["median"] * 100 >= s["median"] * 110:
                better.append(f"{money(ps['median'])} in {s['state']} (+{math.floor((ps['median'] - s['median']) / s['median'] * 100 + 0.5)}%)")
        better = better[:6]
        for e in better:
            expect.append(e)
        if not better and "Close careers that pay more" in t:
            errors.append(f"{slug}/{s['abbr']}: shows better-paying section but none qualify")
    for e in expect:
        checked += 1
        if e not in t:
            errors.append(f"{slug}/{s['abbr']}: missing '{e}'")
    noindex = s["employment"] is None or s["employment"] < MIN_EMP or (s["emp_rse"] is not None and s["emp_rse"] > MAX_RSE)
    has = bool(re.search(r'<meta name="robots" content="noindex', page))
    checked += 1
    # on non-production builds every page is noindex; only check the rule's direction there
    if noindex and not has:
        errors.append(f"{slug}/{s['abbr']}: should be noindex")
for path in ["/careers/registered-nurses/salary/atlantis", "/careers/registered-nurses/salary/CA",
             f"/careers/{next(s for s, o in occ.items() if o['thin'])}/salary/california", "/careers/no-such-job/salary/texas"]:
    code, _ = get(path)
    checked += 1
    if code not in (404, 308):
        errors.append(f"{path}: expected 404, got {code}")
print(f"{len(sample)} state pages, {checked:,} values checked, {len(errors)} problems")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
