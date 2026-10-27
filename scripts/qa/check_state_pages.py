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
    expect = [f"Median pay {money(s['median'])}", f"vs. U.S. median {pct(vs)} ({money(nat)})",
              f"Rank among states {rank} of {len(states)}",
              "Jobs in the state " + ("Not published" if s["employment"] is None else f"{s['employment']:,}"),
              f"earn under {money(s['p10'])}", f"earn over {money(s['p90'])}"]
    for e in expect:
        checked += 1
        if e not in t:
            errors.append(f"{slug}/{s['abbr']}: missing '{e}'")
    noindex = s["employment"] is None or s["employment"] < MIN_EMP
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
