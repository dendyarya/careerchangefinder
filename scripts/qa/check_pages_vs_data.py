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

# ---------------------------------------------------------------- career change at 30/40/50 (rules recomputed)
age = json.loads((P / "situations" / "age.json").read_text())
aw, A = age["all_workers"], age["careers"]
b_ = aw["bands_k"]
nat_share = {"share_under_35": math.floor((b_["16-19"] + b_["20-24"] + b_["25-34"]) / aw["total_k"] * 1000 + 0.5) / 1000,
             "share_45_plus": aw["share_45_plus"], "share_55_plus": aw["share_55_plus"]}
AGE_RULES = {"at-30": ("share_under_35", 4, 3), "at-40": ("share_45_plus", 3, 2), "at-50": ("share_55_plus", 3, 2)}


def age_list(key, max_jz):
    out = []
    for o in good:
        a = A.get(o["code"]) or {}
        p_ = pay(o)
        if o["code"].startswith("11-") or "supervisor" in o["title"].lower():
            continue
        if a.get(key) is None or not p_ or not o["job_zone"] or o["job_zone"] > max_jz:
            continue
        if p_ < aw["us_median_pay"] or a[key] < nat_share[key]:
            continue
        out.append((o, a))
    return sorted(out, key=lambda x: (-pay(x[0]), x[0]["title"]))


for slug_, (key, mj, fj) in AGE_RULES.items():
    f = APP / "career-change" / f"{slug_}.html"
    if not f.exists():
        errors.append(f"{slug_} not built")
        continue
    page = f.read_text()
    tables = re.findall(r"<tbody>(.*?)</tbody>", page, re.S)
    got = [[[text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for r in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S)] for tb in tables]
    main_n = len(age_list(key, mj))
    flat = [row for tb in got for row in tb]
    main_rows, fast_rows = flat[:main_n], flat[main_n:]
    for name, rows_, exp in (("main", main_rows, age_list(key, mj)), ("fast", fast_rows, age_list(key, fj))):
        if len(rows_) != len(exp):
            errors.append(f"{slug_} {name}: {len(rows_)} rows != {len(exp)}")
        for i, (cells, (o, a)) in enumerate(zip(rows_, exp)):
            checked += 4
            want = (str(i + 1), o["title"], money(pay(o)), f"{math.floor(a[key] * 100 + 0.5)}%" + (" Broader group" if a["group"] else ""),
                    "—" if a["median_age"] is None else f"{a['median_age']:.1f}")
            have = (cells[0], cells[1].replace(" Read before you start", ""), cells[2], cells[4], cells[5])
            if have != want:
                errors.append(f"{slug_} {name} row {i + 1}: page {have} != data {want}")
    for s_ in (f"{aw['median_age']}", f"{math.floor(nat_share[key] * 100 + 0.5)}%", money(aw["us_median_pay"])):
        checked += 1
        if s_ not in text(page):
            errors.append(f"{slug_}: missing {s_}")

# ---------------------------------------------------------------- career change to government (rules recomputed)
f = APP / "career-change" / "to-government.html"
if not f.exists():
    errors.append("to-government not built")
else:
    G = json.loads((P / "situations" / "government.json").read_text())["careers"]
    jr = lambda x: math.floor(x + 0.5)
    rows_g = []
    for o in good:
        g = G.get(o["code"])
        if not o["wage"] or o["wage"]["is_group"] or o["code"].startswith("11-") or "supervisor" in o["title"].lower():
            continue
        if not g or not (g.get("government") or {}).get("employment"):
            continue
        gm, pm = g["government"]["median"], (g.get("private") or {}).get("median")
        diff = None if gm is None or not pm else jr((gm - pm) / pm * 100)
        rows_g.append((o, g, diff))
    main_ = sorted([x for x in rows_g if x[1]["government"]["employment"] >= 10000], key=lambda x: (-x[1]["government"]["employment"], x[0]["title"]))
    more_ = sorted([x for x in rows_g if x[2] is not None and x[2] >= 10 and x[1]["government"]["employment"] >= 5000
                    and ((x[1].get("private") or {}).get("employment") or 0) >= 5000], key=lambda x: (-x[2], x[0]["title"]))
    fed_ = sorted([x for x in rows_g if ((x[1].get("federal") or {}).get("employment") or 0) >= 5000],
                  key=lambda x: (-x[1]["federal"]["employment"], x[0]["title"]))
    page = f.read_text()
    flat = [[text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for tb in re.findall(r"<tbody>(.*?)</tbody>", page, re.S)
            for r in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S)]
    n1, n2 = len(main_), len(more_)
    groups = (("main", flat[:n1], main_), ("more", flat[n1:n1 + n2], more_), ("fed", flat[n1 + n2:], fed_))
    for name, rows_, exp in groups:
        if len(rows_) != len(exp):
            errors.append(f"to-government {name}: {len(rows_)} rows != {len(exp)}")
        for i, (cells, (o, g, diff)) in enumerate(zip(rows_, exp)):
            gv, pv = g["government"], g.get("private") or {}
            if name == "main":
                want = (str(i + 1), o["title"], f"{gv['employment']:,}", "—" if g["gov_share"] is None else f"{jr(g['gov_share'] * 100)}%",
                        money(gv["median"]), money(pv.get("median")), pct(diff))
            elif name == "more":
                want = (str(i + 1), o["title"], money(gv["median"]), money(pv.get("median")), pct(diff), f"{gv['employment']:,}")
            else:
                want = (str(i + 1), o["title"], f"{g['federal']['employment']:,}", money(g["federal"]["median"]), money(pv.get("median")))
            checked += len(want)
            if tuple(cells) != want:
                errors.append(f"to-government {name} row {i + 1}: page {tuple(cells)} != data {want}")

# ---------------------------------------------------------------- career change to remote work (rules recomputed)
f = APP / "career-change" / "to-remote-work.html"
if not f.exists():
    errors.append("to-remote-work not built")
else:
    R = json.loads((P / "situations" / "remote.json").read_text())
    us_med = json.loads((P / "situations" / "age.json").read_text())["all_workers"]["us_median_pay"]
    rr = [o for o in good if o["wage"] and not o["wage"]["is_group"] and o["wage"]["median"] is not None and o["wage"]["median"] >= us_med
          and (R["careers"].get(o["code"]) or {}).get("remote_friendly") and not (o["code"].startswith("11-") or "supervisor" in o["title"].lower())
          and not any(o["code"].startswith(p_) for p_ in R["meta"]["licensed_prefixes"])]
    rr.sort(key=lambda o: (-R["meta"]["telework_groups"][o["code"][:2]]["share_teleworked"], -o["wage"]["median"], o["title"]))
    nd = [o for o in rr if (o["job_zone"] or 9) <= 3]
    page = f.read_text()
    flat = [[text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for tb in re.findall(r"<tbody>(.*?)</tbody>", page, re.S)
            for r in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S)]
    for name, rows_, exp in (("main", flat[:len(rr)], rr), ("no-degree", flat[len(rr):], nd)):
        if len(rows_) != len(exp):
            errors.append(f"to-remote-work {name}: {len(rows_)} rows != {len(exp)}")
        for i, (cells, o) in enumerate(zip(rows_, exp)):
            g = R["meta"]["telework_groups"][o["code"][:2]]
            want = (str(i + 1), o["title"], money(o["wage"]["median"]),
                    f"{math.floor(g['share_teleworked'] * 100 + 0.5)}% " + g["title"].removesuffix(" occupations"))
            have = (cells[0], cells[1], cells[2], cells[4])
            checked += 4
            if have != want:
                errors.append(f"to-remote-work {name} row {i + 1}: page {have} != data {want}")

# ---------------------------------------------------------------- career change to tech/healthcare/nursing/trades (rules recomputed)
NURSING_SOC = {"31-1131", "29-2061", "29-1141", "29-1171", "29-1151", "29-1161", "25-1072"}
FIELD_RULES = {
    "to-tech": lambda c: c.startswith("15-12") or c.startswith("15-2051"),
    "to-healthcare": lambda c: c.startswith("29-") or c.startswith("31-"),
    "to-nursing": lambda c: c[:7] in NURSING_SOC,
    "to-skilled-trades": lambda c: (c.startswith("47-2") or c.startswith("47-4") or c.startswith("49-")),
}
A45 = json.loads((P / "situations" / "age.json").read_text())["careers"]
for slug_, rule in FIELD_RULES.items():
    f = APP / "career-change" / f"{slug_}.html"
    if not f.exists():
        errors.append(f"{slug_} not built")
        continue
    mem = [o for o in good if rule(o["code"])]
    in_field = {o["slug"] for o in mem}
    jobs = lambda o: o["wage"]["employment"] if o["wage"] and not o["wage"]["is_group"] else None
    all_ = sorted(mem, key=lambda o: (-(jobs(o) or 0), o["title"]))
    entry = sorted([o for o in mem if (o["job_zone"] or 9) <= 3 and not (o["code"].startswith("11-") or "supervisor" in o["title"].lower())],
                   key=lambda o: (-(0 if (o["wage"] or {}).get("is_group") else ((o["wage"] or {}).get("median") or 0)), o["title"]))
    page = f.read_text()
    tbodies = re.findall(r"<tbody>(.*?)</tbody>", page, re.S)
    flat = [[text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for tb in tbodies for r in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S)]
    # order on page: entry (1-2 tables), starting points (1 table), all (1-2 tables)
    n_e = len(entry)
    e_rows, rest = flat[:n_e], flat[n_e:]
    starts = []
    for o in good:
        if o["slug"] in in_field or rule(o["code"]):
            continue
        tf = P / "transitions" / f"{o['slug']}.json"
        if not tf.exists():
            continue
        best = next((x for x in json.loads(tf.read_text())["top"] if x["slug"] in in_field), None)
        if best:
            starts.append((o, best))
    s_rows, a_rows = rest[:min(20, len(starts))], rest[min(20, len(starts)):]
    for name, rows_, exp in (("entry", e_rows, entry), ("all", a_rows, all_)):
        if len(rows_) != len(exp):
            errors.append(f"{slug_} {name}: {len(rows_)} rows != {len(exp)}")
        for i, (cells, o) in enumerate(zip(rows_, exp)):
            w = o["wage"] or {}
            a = A45.get(o["code"]) or {}
            want = (str(i + 1), o["title"], money(w.get("median")) + (" Broader BLS group" if w.get("is_group") else ""),
                    "—" if jobs(o) is None else f"{jobs(o):,}",
                    "—" if a.get("share_45_plus") is None else f"{math.floor(a['share_45_plus'] * 100 + 0.5)}%")
            have = (cells[0], cells[1], cells[2], cells[4], cells[5])
            checked += 5
            if have != want:
                errors.append(f"{slug_} {name} row {i + 1}: page {have} != data {want}")
    for cells in s_rows:
        o = next((x for x in good if x["title"] == cells[0]), None)
        best = next((b for (s, b) in starts if s is o), None) if o else None
        checked += 2
        if not best or cells[1] != best["title"] or cells[2] != f"{best['match']}%":
            errors.append(f"{slug_} start row {cells[0]}: {cells[1:3]} not the best in-field match")

# nursing at 40: registered nurses' age figures
f = APP / "career-change" / "to-nursing.html"
if f.exists():
    rn = A45.get("29-1141.00") or {}
    want = f"{math.floor(rn['share_45_plus'] * 100 + 0.5)}% of registered nurses are 45 or older and their median age is {rn['median_age']}"
    checked += 2
    if want not in text(f.read_text()):
        errors.append(f"to-nursing: missing '{want}'")

print(f"{checked:,} values checked on built pages, {len(errors)} mismatches")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
