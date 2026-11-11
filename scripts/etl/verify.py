"""Check every number in data/processed against the raw source files.

Run after build.py. Exits with code 1 if anything does not match.
Written separately from build.py so a bug in the build is not copied here.
"""
import glob
import json
import pathlib
import re
import sys

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
P = ROOT / "data" / "processed"
ONET = RAW / "onet" / "db_31_0_excel"

errors = []
checked = {}


def bump(name, n=1):
    checked[name] = checked.get(name, 0) + n


def err(msg):
    if len(errors) < 200:
        errors.append(msg)


def rows(path, sheet=None):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet] if sheet else wb.worksheets[0]
    it = ws.iter_rows(values_only=True)
    head = [str(h).strip() if h is not None else "" for h in next(it)]
    for r in it:
        yield dict(zip(head, r))
    wb.close()


def dec(v):
    """BLS decimal cell (hourly pay, jobs per 1,000, location quotient, RSE) -> float as published, or None."""
    if v is None:
        return None
    try:
        return float(str(v).replace(",", "").strip())
    except ValueError:
        return None


def num(v):
    """BLS cell -> int or None ('*', '**', '#' and blanks mean no figure)."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return int(round(v))
    s = str(v).replace(",", "").strip()
    try:
        return int(round(float(s)))
    except ValueError:
        return None


occ = {o["code"]: o for o in json.loads((P / "occupations.json").read_text())}

print("Slugs ...")
_ms = [m["slug"] for m in json.loads((P / "majors.json").read_text())]
if len(set(_ms)) != len(_ms):
    err("duplicate major slugs")
_sl = [o["slug"] for o in occ.values()]
bump("slugs", len(_sl))
if len(set(_sl)) != len(_sl):
    err("duplicate slugs")
for o in occ.values():
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", o["slug"]):
        err(f"{o['code']} bad slug {o['slug']}")

# ---------------------------------------------------------------- O*NET
print("O*NET occupation data ...")
od = {r["O*NET-SOC Code"]: r for r in rows(ONET / "Occupation Data.xlsx")}
for c, o in occ.items():
    bump("titles+descriptions")
    if c not in od:
        err(f"{c} not in O*NET Occupation Data")
        continue
    if o["title"] != od[c]["Title"]:
        err(f"{c} title {o['title']!r} != {od[c]['Title']!r}")
    if o["description"] != od[c]["Description"]:
        err(f"{c} description differs")

print("Job Zones ...")
jz = {r["O*NET-SOC Code"]: int(r["Job Zone"]) for r in rows(ONET / "Job Zones.xlsx")}
for c, o in occ.items():
    if o["job_zone"] is not None or c in jz:
        bump("job zones")
        if o["job_zone"] != jz.get(c):
            err(f"{c} job zone {o['job_zone']} != {jz.get(c)}")

print("Interests (RIASEC) ...")
ri = {}
for r in rows(ONET / "Career Interest Types.xlsx"):
    if r.get("Scale ID") == "OI":
        ri.setdefault(r["O*NET-SOC Code"], {})[r["Element Name"][0]] = float(r["Data Value"])
for c, o in occ.items():
    if not o["riasec"]:
        continue
    for k, v in o["riasec"].items():
        bump("riasec scores")
        if abs(v - ri.get(c, {}).get(k, -99)) > 0.006:
            err(f"{c} RIASEC {k} {v} != {ri.get(c, {}).get(k)}")

print("Skills, knowledge ...")
for fname, field in (("Transferable Skills.xlsx", "transferable_skills"), ("Essential Skills.xlsx", "essential_skills"),
                     ("Knowledge.xlsx", "knowledge")):
    im = {}
    for r in rows(ONET / fname):
        if r.get("Scale ID") == "IM":
            im[(r["O*NET-SOC Code"], r["Element Name"])] = float(r["Data Value"])
    for c, o in occ.items():
        vals = [x["value"] for x in o[field]]
        if vals != sorted(vals, reverse=True):
            err(f"{c} {field} not sorted by importance")
        for x in o[field]:
            bump(field)
            src = im.get((c, x["name"]))
            if src is None or abs(src - x["value"]) > 0.006:
                err(f"{c} {field} {x['name']} {x['value']} != {src}")

print("Tasks ...")
tasks = {}
for r in rows(ONET / "Task Statements.xlsx"):
    tasks.setdefault(r["O*NET-SOC Code"], set()).add(r["Task"])
for c, o in occ.items():
    for t in o["tasks"]:
        bump("tasks")
        if t not in tasks.get(c, set()):
            err(f"{c} task not in source: {t[:60]}")

print("Work Context (downsides) ...")
wc = {}
for r in rows(ONET / "Work Context.xlsx"):
    if r.get("Scale ID") == "CX":
        wc[(r["O*NET-SOC Code"], r["Element Name"])] = float(r["Data Value"])
for c, o in occ.items():
    for d in o["downsides"]:
        bump("downsides")
        src = wc.get((c, d["factor"]))
        if src is None or abs(src - d["value"]) > 0.006 or src < 3.5:
            err(f"{c} downside {d['factor']} {d['value']} != {src}")

print("Completeness of top lists ...")
# a shown list must hold the highest-rated items: nothing left out may rate higher than the lowest shown
for fname, field, scale in (("Transferable Skills.xlsx", "transferable_skills", "IM"),
                            ("Essential Skills.xlsx", "essential_skills", "IM"), ("Knowledge.xlsx", "knowledge", "IM")):
    allv = {}
    for r in rows(ONET / fname):
        if r.get("Scale ID") == scale:
            allv.setdefault(r["O*NET-SOC Code"], {})[r["Element Name"]] = float(r["Data Value"])
    for c, o in occ.items():
        if not o[field]:
            if allv.get(c):
                err(f"{c} {field} empty but source has data")
            continue
        bump(f"{field} completeness")
        shown = {x["name"] for x in o[field]}
        low = min(x["value"] for x in o[field])
        left = [v for n, v in allv.get(c, {}).items() if n not in shown]
        if left and max(left) > low + 0.006:
            err(f"{c} {field}: an item rated {max(left)} was left out (lowest shown {low})")

print("Tasks and downsides completeness ...")
t_im = {}
for r in rows(ONET / "Task Ratings.xlsx"):
    if r.get("Scale ID") == "IM":
        t_im[(r["O*NET-SOC Code"], r["Task ID"])] = float(r["Data Value"])
t_text = {}
for r in rows(ONET / "Task Statements.xlsx"):
    t_text.setdefault(r["O*NET-SOC Code"], {})[r["Task"]] = t_im.get((r["O*NET-SOC Code"], r["Task ID"]))
for c, o in occ.items():
    if not o["tasks"]:
        continue
    bump("tasks completeness")
    src = t_text.get(c, {})
    shown = [src.get(t) for t in o["tasks"]]
    if None in shown:
        continue  # tasks without an importance rating: order cannot be checked
    low = min(shown)
    if any(v is not None and v > low + 0.006 for t, v in src.items() if t not in o["tasks"]):
        err(f"{c} tasks: a more important task was left out")
DOWN = ["Time Pressure", "Consequence of Error", "Conflict Situations",
        "Dealing with Violent or Physically Aggressive People", "Exposed to Disease or Infections",
        "Exposed to Hazardous Conditions", "Spend Time Standing", "Outdoors, Exposed to All Weather Conditions"]
for c, o in occ.items():
    bump("downsides completeness")
    qual = sorted([wc[(c, f)] for f in DOWN if wc.get((c, f), 0) >= 3.5], reverse=True)[:3]
    got = [d["value"] for d in o["downsides"]]
    if [round(x, 2) for x in qual] != got:
        err(f"{c} downsides {got} != expected {qual}")

print("Holland codes ...")
for c, o in occ.items():
    if not o["riasec"]:
        continue
    bump("holland codes")
    src = ri.get(c, {})
    order = sorted(src.items(), key=lambda kv: -kv[1])
    third = order[2][1]
    vals = [src.get(L, -1) for L in o["holland"]]
    if len(set(o["holland"])) != 3 or vals != sorted(vals, reverse=True):
        err(f"{c} holland {o['holland']} not in score order {order[:3]}")
    if any(src.get(L, -1) < third - 0.006 for L in o["holland"]):
        err(f"{c} holland letter not in top 3")

print("Alternate titles, work styles, contact ...")
alt = {}
for r in rows(ONET / "Job Titles.xlsx"):
    alt.setdefault(r["O*NET-SOC Code"], set()).add(r["Job Title"])
for c, o in occ.items():
    for a in o["alt_titles"]:
        bump("alternate titles")
        if a not in alt.get(c, set()):
            err(f"{c} alt title not in source: {a}")
ws_vals = {}
for r in rows(ONET / "Work Styles.xlsx"):
    ws_vals.setdefault(r["Scale ID"], {}).setdefault(r["O*NET-SOC Code"], {})[r["Element Name"]] = float(r["Data Value"])
for c, o in occ.items():
    dr = ws_vals.get("DR", {}).get(c, {})
    wi = ws_vals.get("WI", {}).get(c, {})
    exp = sorted([n for n, v in dr.items() if v > 0], key=lambda n: (-dr[n], -wi.get(n, 0)))[:5]
    bump("work styles", len(o["work_styles"]))
    if o["work_styles"] != exp:
        err(f"{c} work styles {o['work_styles']} != expected {exp}")
for c, o in occ.items():
    if o["contact_with_others"] is not None:
        bump("contact with others")
        src = wc.get((c, "Contact With Others"))
        if src is None or abs(src - o["contact_with_others"]) > 0.006:
            err(f"{c} contact {o['contact_with_others']} != {src}")

print("First step (education, training, experience) ...")
cat_label = {}
for fname in ("Education Categories.xlsx", "Training and Experience Categories.xlsx"):
    for r in rows(ONET / fname):
        cat_label[(r["Element Name"], r["Scale ID"], int(r["Category"]))] = str(r["Category Description"])
dist = {}
for fname in ("Education.xlsx", "Training and Experience.xlsx"):
    for r in rows(ONET / fname):
        if r.get("Category") not in (None, "", "n/a"):
            dist.setdefault((r["O*NET-SOC Code"], r["Element Name"], r["Scale ID"]), {})[int(r["Category"])] = float(r["Data Value"])
for c, o in occ.items():
    fs = o["first_step"]
    if fs["job_zone"] != o["job_zone"]:
        err(f"{c} first_step job zone differs")
    for key, el, sc in (("typical_education", "Required Level of Education", "RL"),
                        ("on_the_job_training", "On-the-Job Training", "OJ"),
                        ("related_experience", "Related Work Experience", "RW")):
        v = fs.get(key)
        if not v:
            continue
        bump("first-step items")
        d = dist.get((c, el, sc), {})
        if not d or abs(d.get(v["category"], -1) - v["pct"]) > 0.051 or v["pct"] < max(d.values()) - 0.051:
            err(f"{c} {key} {v} not the most common category in source")
        if v["label"] != cat_label.get((el, sc, v["category"])):
            err(f"{c} {key} label {v['label']!r} != {cat_label.get((el, sc, v['category']))!r}")

print("Education distribution ...")
for c, o in occ.items():
    d = dist.get((c, "Required Level of Education", "RL"), {})
    for e in o.get("education_dist", []):
        bump("education shares")
        if abs(d.get(e["category"], -1) - e["pct"]) > 0.051 or e["label"] != cat_label.get(("Required Level of Education", "RL", e["category"])):
            err(f"{c} education {e} != source")
    if o.get("education_dist") is not None and len(o["education_dist"]) != sum(1 for v in d.values() if v > 0):
        err(f"{c} education categories missing")

print("Thin flags ...")
for c, o in occ.items():
    bump("thin flags")
    no_pay = not o["wage"] or o["wage"]["median"] is None
    if no_pay and not o["thin"]:
        err(f"{c} has no BLS median but is not thin")
    if "All Other" in o["title"] and not o["thin"]:
        err(f"{c} All Other but not thin")

# ---------------------------------------------------------------- BLS
print("BLS national ...")
nat = {}
for r in rows(RAW / "bls" / "national_M2025_dl.xlsx"):
    if str(r.get("O_GROUP", "")).strip() == "detailed":
        nat[str(r["OCC_CODE"]).strip()] = r
for c, o in occ.items():
    w = o["wage"]
    if not w:
        if c[:7] in nat and num(nat[c[:7]]["A_MEDIAN"]) is not None:
            err(f"{c} has BLS median in source but none in output")
        continue
    r = nat.get(w["bls_code"])
    if r is None or w["bls_code"] != c[:7]:
        err(f"{c} BLS code {w['bls_code']} not found / wrong")
        continue
    for k, col in (("median", "A_MEDIAN"), ("p10", "A_PCT10"), ("p25", "A_PCT25"), ("p75", "A_PCT75"),
                   ("p90", "A_PCT90"), ("employment", "TOT_EMP")):
        bump("national wage cells")
        if w[k] != num(r[col]):
            err(f"{c} {k} {w[k]} != BLS {r[col]}")
    if w["bls_title"] != str(r["OCC_TITLE"]).strip():
        err(f"{c} BLS title {w['bls_title']!r} != {r['OCC_TITLE']!r}")

print("BLS state ...")
st = {}
for r in rows(RAW / "bls" / "state_M2025_dl.xlsx"):
    if str(r.get("O_GROUP", "")).strip() == "detailed":
        st[(str(r["OCC_CODE"]).strip(), str(r["PRIM_STATE"]).strip())] = r
for f in glob.glob(str(P / "wages" / "*.json")):
    d = json.loads(pathlib.Path(f).read_text())
    meds = [s["median"] for s in d["states"]]
    if meds != sorted(meds, reverse=True):
        err(f"{f} states not sorted")
    for s in d["states"]:
        r = st.get((d["bls_code"], s["abbr"]))
        if r is None:
            err(f"{d['bls_code']} {s['abbr']} not in state file")
            continue
        for k, col in (("median", "A_MEDIAN"), ("p10", "A_PCT10"), ("p25", "A_PCT25"), ("p75", "A_PCT75"),
                       ("p90", "A_PCT90"), ("employment", "TOT_EMP")):
            bump("state wage cells")
            if s[k] != num(r[col]):
                err(f"{d['bls_code']} {s['abbr']} {k} {s[k]} != BLS {r[col]}")
        for k, col in (("hourly_median", "H_MEDIAN"), ("jobs_per_1000", "JOBS_1000"), ("lq", "LOC_QUOTIENT"), ("emp_rse", "EMP_PRSE")):
            bump("state wage cells")
            if s[k] != dec(r[col]):
                err(f"{d['bls_code']} {s['abbr']} {k} {s[k]} != BLS {r[col]}")

print("BLS state totals ...")
tot = json.loads((P / "state_totals.json").read_text())
src = {str(r["PRIM_STATE"]).strip(): r for r in rows(RAW / "bls" / "state_M2025_dl.xlsx") if str(r["OCC_CODE"]).strip() == "00-0000"}
for a, t in tot.items():
    r = src.get(a)
    if r is None:
        err(f"state total {a} not in BLS file")
        continue
    for k, col in (("employment", "TOT_EMP"), ("median", "A_MEDIAN")):
        bump("state total cells")
        if t[k] != num(r[col]):
            err(f"state total {a} {k} {t[k]} != BLS {r[col]}")
    bump("state total cells")
    if t["hourly_median"] != dec(r["H_MEDIAN"]):
        err(f"state total {a} hourly {t['hourly_median']} != BLS {r['H_MEDIAN']}")
if len(tot) != 51:
    err(f"state totals: {len(tot)} areas, expected 51")

# ---------------------------------------------------------------- NCES
print("NCES crosswalk ...")
cw = {}
cw_soc = {}
cip_title = {}
for r in rows(RAW / "nces" / "CIP2020_SOC2018_Crosswalk.xlsx", "CIP-SOC"):
    cip, soc = str(r["CIP2020Code"]).strip(), str(r["SOC2018Code"]).strip()
    cw.setdefault(cip, set()).add(soc)
    if cip != "99.9999":  # placeholder "NO MATCH", not a major
        cw_soc.setdefault(soc, set()).add(cip)
    cip_title[cip] = str(r["CIP2020Title"]).strip().rstrip(".")
for c, o in occ.items():
    for m in o["majors"]:
        bump("occupation->major links")
        if m["cip"] == "99.9999":
            err(f"{c} links to placeholder major 99.9999")
        if c[:7] not in cw.get(m["cip"], set()):
            err(f"{c} major {m['cip']} not linked in crosswalk")
        if m["title"].strip() != cip_title.get(m["cip"]):
            err(f"{c} major title {m['title']!r} != {cip_title.get(m['cip'])!r}")
    n_src = len(cw_soc.get(c[:7], set()))
    if len(o["majors"]) < min(n_src, 12):
        err(f"{c} shows {len(o['majors'])} majors, crosswalk has {n_src}")
for m in json.loads((P / "majors.json").read_text()):
    if m["cip"] == "99.9999" or "NO MATCH" in m["title"].upper():
        err(f"placeholder major {m['cip']} {m['title']}")
    for c in m["careers"]:
        bump("major->career links")
        if c[:7] not in cw.get(m["cip"], set()):
            err(f"major {m['cip']} career {c} not linked in crosswalk")

# ---------------------------------------------------------------- transitions
print("Skill vectors ...")
_ts = {}
for r in rows(ONET / "Transferable Skills.xlsx"):
    if r.get("Scale ID") == "IM":
        _ts[(r["O*NET-SOC Code"], r["Element Name"])] = float(r["Data Value"])
_slug2code = {o["slug"]: c for c, o in occ.items()}
for slug, vec in json.loads((P / "skills.json").read_text()).items():
    c = _slug2code.get(slug)
    for name, v in vec.items():
        bump("skill vector values")
        if c is None or abs(_ts.get((c, name), -9) - v) > 0.006:
            err(f"skills.json {slug} {name} {v}")

print("Transitions arithmetic and rules ...")
ts_im = {}
for r in rows(ONET / "Transferable Skills.xlsx"):
    if r.get("Scale ID") == "IM":
        ts_im[(r["O*NET-SOC Code"], r["Element Name"])] = float(r["Data Value"])
for f in glob.glob(str(P / "transitions" / "*.json")) + glob.glob(str(P / "hubs" / "*.json")):
    d = json.loads(pathlib.Path(f).read_text())
    base = d["baseline_median"]
    if "hubs" not in f:
        for sk in d["source_skills"]:
            bump("source skills")
            if abs(ts_im.get((d["code"], sk["name"]), -9) - sk["value"]) > 0.006:
                err(f"{f} source skill {sk['name']} {sk['value']}")
    for t in d["top"] + d["similar_in_field"]:
        bump("transition items")
        for name, v in t.get("skill_imp", {}).items():
            bump("target skill values")
            if abs(ts_im.get((t["code"], name), -9) - v) > 0.006:
                err(f"{f} {t['code']} skill {name} {v} != {ts_im.get((t['code'], name))}")
        o = occ[t["code"]]
        if o["thin"]:
            err(f"{f} thin target {t['code']}")
        if t["median"] != o["wage"]["median"] or t["job_zone"] != o["job_zone"] or t["title"] != o["title"]:
            err(f"{f} {t['code']} fields differ from occupations.json")
        if t["wage_is_group"]:
            if t["pay_change_pct"] is not None:
                err(f"{f} {t['code']} group wage used in pay change")
        elif base:
            exp = int(round((t["median"] - base) / base * 100))
            if t["pay_change_pct"] != exp:
                err(f"{f} {t['code']} pay change {t['pay_change_pct']} != {exp}")
        if not 0 <= t["match"] <= 99:
            err(f"{f} match out of range")
    prev = 100
    for t in d.get("similar", []) if "hubs" not in f else []:
        bump("similar-job items")
        o = occ[t["code"]]
        if o["thin"] or t["code"] == d["code"]:
            err(f"{f} similar: thin or self {t['code']}")
        if t["median"] != o["wage"]["median"] or t["job_zone"] != o["job_zone"] or t["title"] != o["title"] or t["slug"] != o["slug"]:
            err(f"{f} similar {t['code']} fields differ from occupations.json")
        if t["wage_is_group"] != o["wage"]["is_group"]:
            err(f"{f} similar {t['code']} group flag differs")
        if t["wage_is_group"]:
            if t["pay_change_pct"] is not None:
                err(f"{f} similar {t['code']} group wage used in pay change")
        elif base:
            exp = int(round((t["median"] - base) / base * 100))
            if t["pay_change_pct"] != exp:
                err(f"{f} similar {t['code']} pay change {t['pay_change_pct']} != {exp}")
        if not 0 <= t["similarity"] <= prev:
            err(f"{f} similar list not sorted or out of range at {t['code']}")
        prev = t["similarity"]
    if "hubs" not in f and len(d.get("similar", [])) != 20:
        err(f"{f} has {len(d.get('similar', []))} similar jobs, expected 20")
_tops = {}
for f in glob.glob(str(P / "transitions" / "*.json")):
    d = json.loads(pathlib.Path(f).read_text())
    _tops[d["code"]] = ({t["code"]: t["match"] for t in d["top"]}, d.get("into", []))
for code, (_, into) in _tops.items():
    for x in into:
        bump("into links")
        if _tops.get(x["code"], ({}, []))[0].get(code) != x["match"]:
            err(f"{code} into {x['code']} match {x['match']} not in source's top list")

print()
for k, v in checked.items():
    print(f"  {k:28s} {v:>8,}")
print(f"\n{sum(checked.values()):,} values checked, {len(errors)} problems")
for e in errors[:50]:
    print("  -", e)
sys.exit(1 if errors else 0)
