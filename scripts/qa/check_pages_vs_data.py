"""Check numbers shown in the built HTML against data/processed (run after `next build`).

For every /career-change/from-* page: the first 10 table rows (rank, career, skill match,
median pay, pay change) must equal the source JSON, group wages must say "Not compared",
and the baseline median in the note must match. Also checks the 10 Big Five result pages'
career lists and pay. Exits 1 on any mismatch.
"""
import html
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

print(f"{checked:,} values checked on built pages, {len(errors)} mismatches")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
