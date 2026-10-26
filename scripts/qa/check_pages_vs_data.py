"""Check numbers shown in the built HTML against data/processed (run after `next build`).

For every /career-change/from-* page: the first 10 table rows (rank, career, skill match,
median pay, pay change) must equal the source JSON, group wages must say "Not compared",
and the baseline median in the note must match. Also checks the 10 Big Five result pages'
career lists and pay, every /jobs-similar-to page (all 20 rows), and every /careers listing page,
whose order is recomputed here from the documented rules (independent of the TypeScript code).
Exits 1 on any mismatch.
"""
import html
import math
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
APP = ROOT / ".next" / "server" / "app"
P = ROOT / "data" / "processed"
T = ROOT / "data" / "tests"
errors, checked = [], 0


def money(n):
    return "—" if n is None else f"${n:,}"


def pct(n):
    return "—" if n is None else (f"+{n}%" if n > 0 else (f"−{abs(n)}%" if n < 0 else "0%"))


def text(s):
    t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()
    return re.sub(r"(\d) %", r"\1%", t)


hubs = json.loads((P / "hubs.json").read_text())
occ = {o["slug"]: o for o in json.loads((P / "occupations.json").read_text())}
for f in sorted((APP / "career-change").glob("from-*.html")):
    slug = f.stem[5:]
    src = P / "hubs" / f"{slug}.json" if slug in hubs else P / "transitions" / f"{slug}.json"
    d = json.loads(src.read_text())
    page = f.read_text()
    tbody = re.search(r"<tbody>(.*?)</tbody>", page, re.S)
    if not tbody:
        errors.append(f"{slug}: no table")
        continue
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbody.group(1), re.S)
    for i, (row, t) in enumerate(zip(rows, d["top"][:10])):
        cells = [text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        exp_change = "Not compared" if t["wage_is_group"] else pct(t["pay_change_pct"])
        got = (cells[0], cells[1], cells[2], cells[3].split(" Pay for")[0], cells[4])
        exp = (str(i + 1), t["title"], f"{t['match']}%", money(t["median"]), exp_change)
        checked += 5
        if got != exp:
            errors.append(f"{slug} row {i + 1}: page {got} != data {exp}")
    if len(rows) != min(10, len(d["top"])):
        errors.append(f"{slug}: {len(rows)} rows shown")
    if money(d["baseline_median"]) not in text(page):
        errors.append(f"{slug}: baseline {money(d['baseline_median'])} missing")
    checked += 1

tp = json.loads((T / "trait-pages.json").read_text())
for key, v in tp.items():
    page = (APP / "tests" / "results" / f"{key}.html").read_text()
    t = text(page)
    for c in v["careers"]:
        checked += 2
        if c["title"] not in t:
            errors.append(f"{key}: missing {c['title']}")
        if c["median"] is not None and money(c["median"]) not in t:
            errors.append(f"{key}: pay {money(c['median'])} for {c['title']} missing")

# ---------------------------------------------------------------- jobs similar to
for f in sorted((APP / "jobs-similar-to").glob("*.html")):
    d = json.loads((P / "transitions" / f"{f.stem}.json").read_text())
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", re.search(r"<tbody>(.*?)</tbody>", f.read_text(), re.S).group(1), re.S)
    if len(rows) != len(d["similar"]):
        errors.append(f"similar {f.stem}: {len(rows)} rows != {len(d['similar'])}")
    for i, (row, t) in enumerate(zip(rows, d["similar"])):
        cells = [text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        pay = f"{money(t['median'])} Broader BLS group · not compared" if t["wage_is_group"] else (
            money(t["median"]) + ("" if t["pay_change_pct"] is None else f" {pct(t['pay_change_pct'])}"))
        got = (cells[0], cells[1], cells[2], cells[3])
        exp = (str(i + 1), t["title"] + (" Same group" if t["same_field"] else ""), f"{t['similarity']}%", pay)
        checked += 5
        if got != exp:
            errors.append(f"similar {f.stem} row {i + 1}: page {got} != data {exp}")

# ---------------------------------------------------------------- listings (rules recomputed)
good = [o for o in occ.values() if not o["thin"]]
good.sort(key=lambda o: o["code"])
attrs = {c["code"]: c["attrs"] for c in json.loads((T / "career-attributes.json").read_text())["careers"]}
pay = lambda o: o["wage"]["median"] if o["wage"] and not o["wage"]["is_group"] and o["wage"]["median"] else 0
cat = lambda o: (o["first_step"].get("typical_education") or {}).get("category", -1)
soc = dict(re.findall(r'code: "(\d\d-)", slug: "([^"]+)"', (ROOT / "lib" / "soc.ts").read_text()))
soc = {v: k for k, v in soc.items()}
expected = {}
for slug, code in soc.items():
    expected[("industry", slug)] = [o["title"] for o in sorted((o for o in good if o["code"].startswith(code)),
                                    key=lambda o: (-((o["wage"] or {}).get("employment") or 0), o["title"]))]
for slug, cats in {"no-degree": [1, 2], "certificate": [3, 4, 5], "bachelors": [6, 7], "masters": [8]}.items():
    expected[("education", slug)] = [o["title"] for o in sorted((o for o in good if cat(o) in cats), key=lambda o: -pay(o))]
PERS = {"introverts": ("contact", 1, 3), "extroverts": ("contact", -1, 0), "detail-oriented": ("conscientiousness", -1, 0),
        "hate-routine": ("repetition", 1, 3), "competitive": ("competition", -1, 0), "low-stress": ("time_pressure", 1, 3),
        "high-pressure": ("time_pressure", -1, 0)}
for slug, (a, sign, minjz) in PERS.items():
    pool = [o for o in good if (attrs.get(o["code"]) or {}).get(a) is not None and (o["job_zone"] or 0) >= minjz]
    expected[("personality", slug)] = [o["title"] for o in sorted(pool, key=lambda o: (sign * attrs[o["code"]][a], -pay(o)))][:50]
for slug, L in {"creative": "A", "hands-on": "R", "helping-people": "S"}.items():
    pool = [o for o in good if o["riasec"]]
    expected[("personality", slug)] = [o["title"] for o in sorted(pool, key=lambda o: (-(o["riasec"].get(L) or 0), -pay(o)))][:50]
for L, name in zip("RIASEC", ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"]):
    expected[("holland-code", name)] = [o["title"] for o in sorted((o for o in good if (o["holland"] or " ")[0] == L),
                                        key=lambda o: -o["riasec"][L])]
expected[("salary", "high-paying")] = [o["title"] for o in sorted((o for o in good if pay(o) > 0), key=lambda o: -pay(o))][:50]
expected[("salary", "high-paying-no-degree")] = [o["title"] for o in sorted((o for o in good if pay(o) > 0 and cat(o) in (1, 2)),
                                                 key=lambda o: -pay(o))][:50]
by_title = {o["title"]: o for o in good}
for (kind, slug), titles in expected.items():
    f = APP / "careers" / kind / f"{slug}.html"
    if not f.exists():
        errors.append(f"listing {kind}/{slug} not built")
        continue
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", re.search(r"<tbody>(.*?)</tbody>", f.read_text(), re.S).group(1), re.S)
    got = []
    for row in rows:
        cells = [text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        got.append(cells[1])
        o = by_title.get(cells[1])
        checked += 2
        if o is None or not cells[2].startswith(money(o["wage"]["median"] if o["wage"] else None)):
            errors.append(f"listing {kind}/{slug}: pay for {cells[1]} {cells[2]}")
        if o and o["wage"] and o["wage"]["is_group"] != ("Broader BLS group" in cells[2]):
            errors.append(f"listing {kind}/{slug}: group label for {cells[1]}")
    if got != titles:
        diff = next((i for i, (a, b) in enumerate(zip(got, titles)) if a != b), min(len(got), len(titles)))
        errors.append(f"listing {kind}/{slug}: order differs at row {diff + 1} ({len(got)} vs {len(titles)} rows)")

# ---------------------------------------------------------------- salary by state
for slug, o in occ.items():
    wf = P / "wages" / f"{slug}.json"
    f = APP / "careers" / slug / "salary.html"
    if o["thin"] or not o["wage"] or not wf.exists():
        if f.exists():
            errors.append(f"salary page built for {slug} without data")
        continue
    if not f.exists():
        errors.append(f"salary {slug} not built")
        continue
    states = json.loads(wf.read_text())["states"]
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", re.search(r"<tbody>(.*?)</tbody>", f.read_text(), re.S).group(1), re.S)
    nat = o["wage"]["median"]
    np_ = lambda v: "Not published" if v is None else money(v)
    if len(rows) != len(states):
        errors.append(f"salary {slug}: {len(rows)} rows != {len(states)}")
    for i, (row, s_) in enumerate(zip(rows, states)):
        cells = [text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        vs = None if not nat else math.floor((s_["median"] - nat) / nat * 100 + 0.5)  # JS Math.round
        exp = (str(i + 1), s_["state"], money(s_["median"]), pct(vs), np_(s_["p10"]), np_(s_["p90"]),
               "Not published" if s_["employment"] is None else f"{s_['employment']:,}")
        checked += 7
        if tuple(cells) != exp:
            errors.append(f"salary {slug} row {i + 1}: page {tuple(cells)} != data {exp}")

print(f"{checked:,} values checked on built pages, {len(errors)} mismatches")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
