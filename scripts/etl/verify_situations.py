"""Check data/processed/situations against the raw BLS files, cell by cell. Exits 1 on any problem.

age.json: every CPS row named for a career must exist in Table 11b with the same numbers; totals,
band sums and shares are recomputed; median age only for single rows; each career's CPS title
must match its BLS SOC title or be listed in CPS_MANUAL.
government.json: every value must equal the OEWS ownership file for the career's BLS code.
"""
import json
import pathlib
import re
import sys

import openpyxl

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from build_situations import AGE_BANDS, CPS_MANUAL, CPS_MIN_TOTAL_K, OWN, bls_soc  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "bls"
P = ROOT / "data" / "processed"
errors, checked = [], 0


def err(m):
    errors.append(m)


def num(v):
    try:
        return float(str(v).replace(",", "")) if v not in (None, "") else None
    except ValueError:
        return None


norm = lambda s: re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()
occ = {o["code"]: o for o in json.loads((P / "occupations.json").read_text())}

# ------------------------------------------------------------------ age
cps = {}
for r in openpyxl.load_workbook(RAW / "cps" / "cpsaat11b_2025.xlsx", read_only=True).active.iter_rows(values_only=True):
    if r[0] and r[1] is not None:
        cps[str(r[0]).strip()] = r
nat = list(openpyxl.load_workbook(RAW / "national_M2025_dl.xlsx", read_only=True).active.iter_rows(values_only=True))
h = nat[0]
soc_title = {r[h.index("OCC_CODE")]: r[h.index("OCC_TITLE")] for r in nat[1:]}

age = json.loads((P / "situations" / "age.json").read_text())
tot = cps["Total employed"]
aw = age["all_workers"]
checked += 3
if aw["total_k"] != tot[1] or aw["median_age"] != tot[9] or aw["bands_k"]["65+"] != tot[8]:
    err("all-workers row differs")
us = next(r for r in nat[1:] if r[h.index("OCC_CODE")] == "00-0000")
checked += 1
if aw["us_median_pay"] != num(us[h.index("A_MEDIAN")]):
    err("U.S. median pay differs")
for code, v in age["careers"].items():
    o = occ.get(code)
    if not o or o["thin"]:
        err(f"{code}: not a full-page career")
        continue
    soc = bls_soc(o)
    total, bands = 0, {b: 0 for b in AGE_BANDS}
    for t in v["cps_titles"]:
        r = cps.get(t)
        checked += 1
        if r is None:
            err(f"{code}: CPS row {t!r} not in file")
            continue
        covered = CPS_MANUAL.get(t)
        if covered is None:
            # title match: the CPS title must equal the SOC title of this code or of a group above it
            groups = [soc, soc[:6] + "0", soc[:4] + "000"]
            if not any(norm(soc_title.get(g, "")) == norm(t) for g in groups):
                err(f"{code}: CPS {t!r} does not match SOC titles of {groups}")
        elif soc not in covered:
            err(f"{code}: manual CPS row {t!r} does not cover {soc}")
        total += num(r[1]) or 0
        for b, x in zip(AGE_BANDS, r[2:9]):
            bands[b] += num(x) or 0
    checked += 4
    if v["total_k"] != total or v["bands_k"] != bands:
        err(f"{code}: totals differ {v['total_k']} vs {total}")
    exp_med = num(cps[v["cps_titles"][0]][9]) if len(v["cps_titles"]) == 1 else None
    if v["median_age"] != exp_med:
        err(f"{code}: median age {v['median_age']} != {exp_med}")
    enough = total >= CPS_MIN_TOTAL_K
    exp45 = round((bands["45-54"] + bands["55-64"] + bands["65+"]) / total, 3) if enough and total else None
    if v["share_45_plus"] != exp45 or v["enough_data"] != enough:
        err(f"{code}: share 45+ {v['share_45_plus']} != {exp45}")

# ------------------------------------------------------------------ government
own = {}
rows = list(openpyxl.load_workbook(RAW / "oesm25in4" / "national_owner_M2025_dl.xlsx", read_only=True).worksheets[0].iter_rows(values_only=True))
h = rows[0]
for r in rows[1:]:
    own[(r[h.index("OCC_CODE")], OWN.get(str(r[h.index("OWN_CODE")])))] = r
gov = json.loads((P / "situations" / "government.json").read_text())
for code, v in gov["careers"].items():
    soc = bls_soc(occ[code])
    if v["bls_code"] != soc:
        err(f"{code}: bls code {v['bls_code']} != {soc}")
    for k in OWN.values():
        r = own.get((soc, k))
        if k not in v:
            if r is not None and num(r[h.index("TOT_EMP")]) is not None:
                err(f"{code}: {k} missing but in file")
            continue
        for field, col in (("employment", "TOT_EMP"), ("median", "A_MEDIAN"), ("p10", "A_PCT10"), ("p90", "A_PCT90")):
            checked += 1
            if v[k][field] != num(r[h.index(col)]):
                err(f"{code} {k} {field}: {v[k][field]} != {r[h.index(col)]}")
    g, p = v["government"]["employment"], (v.get("private") or {}).get("employment")
    exp = round(g / (g + p), 3) if g is not None and p is not None and (g + p) else None
    checked += 1
    if v["gov_share"] != exp:
        err(f"{code}: gov share {v['gov_share']} != {exp}")

print(f"{checked:,} situation values checked, {len(errors)} problems")
for e in errors[:40]:
    print("  -", e)
sys.exit(1 if errors else 0)
