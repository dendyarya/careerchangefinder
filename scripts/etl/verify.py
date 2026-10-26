"""Check every number in data/processed against the raw source files.

Run after build.py. Exits with code 1 if anything does not match.
Written separately from build.py so a bug in the build is not copied here.
"""
import glob
import json
import pathlib
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
        for k, col in (("median", "A_MEDIAN"), ("p10", "A_PCT10"), ("p90", "A_PCT90"), ("employment", "TOT_EMP")):
            bump("state wage cells")
            if s[k] != num(r[col]):
                err(f"{d['bls_code']} {s['abbr']} {k} {s[k]} != BLS {r[col]}")

# ---------------------------------------------------------------- NCES
print("NCES crosswalk ...")
cw = {}
cw_soc = {}
for r in rows(RAW / "nces" / "CIP2020_SOC2018_Crosswalk.xlsx", "CIP-SOC"):
    cip, soc = str(r["CIP2020Code"]).strip(), str(r["SOC2018Code"]).strip()
    cw.setdefault(cip, set()).add(soc)
    cw_soc.setdefault(soc, set()).add(cip)
for c, o in occ.items():
    for m in o["majors"]:
        bump("occupation->major links")
        if c[:7] not in cw.get(m["cip"], set()):
            err(f"{c} major {m['cip']} not linked in crosswalk")
for m in json.loads((P / "majors.json").read_text()):
    for c in m["careers"]:
        bump("major->career links")
        if c[:7] not in cw.get(m["cip"], set()):
            err(f"major {m['cip']} career {c} not linked in crosswalk")

# ---------------------------------------------------------------- transitions
print("Transitions arithmetic and rules ...")
for f in glob.glob(str(P / "transitions" / "*.json")) + glob.glob(str(P / "hubs" / "*.json")):
    d = json.loads(pathlib.Path(f).read_text())
    base = d["baseline_median"]
    for t in d["top"] + d["similar_in_field"]:
        bump("transition items")
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

print()
for k, v in checked.items():
    print(f"  {k:28s} {v:>8,}")
print(f"\n{sum(checked.values()):,} values checked, {len(errors)} problems")
for e in errors[:50]:
    print("  -", e)
sys.exit(1 if errors else 0)
