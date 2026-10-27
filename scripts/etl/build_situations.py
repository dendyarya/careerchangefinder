"""Data for the career-change situation pages (/career-change/at-[age], to-[field]). Run after build.py.

Sources (kept in data/raw/bls, downloaded by hand because bls.gov blocks automated downloads):
  cps/cpsaat11b_2025.xlsx                 BLS CPS 2025 annual averages, Table 11b: employed people by
                                          detailed occupation and age (thousands; 11-month average, no October)
  oesm25in4/national_owner_M2025_dl.xlsx  BLS OEWS May 2025, national cross-industry by ownership
                                          (federal, state, local government, private)

Writes data/processed/situations/age.json and government.json, keyed by O*NET-SOC code.

CPS occupations have titles but no SOC codes. They are matched to the BLS OEWS SOC titles
(case and punctuation ignored); titles that differ are listed in CPS_MANUAL below, each with the SOC
codes it covers. "Other ..." catch-all rows are not used. When a CPS row covers several SOC codes, or a
SOC code is covered by several CPS rows, the page says the figure is for a broader group.
"""
import json
import pathlib
import re

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "bls"
P = ROOT / "data" / "processed"
OUT = P / "situations"

CPS_FILE = RAW / "cps" / "cpsaat11b_2025.xlsx"
OWNER_FILE = RAW / "oesm25in4" / "national_owner_M2025_dl.xlsx"
AGE_BANDS = ["16-19", "20-24", "25-34", "35-44", "45-54", "55-64", "65+"]
# CPS publishes no median age where the base is under 50,000; we use the same floor for age shares
CPS_MIN_TOTAL_K = 50

# CPS titles that do not match an OEWS SOC title word for word -> SOC codes they cover
CPS_MANUAL = {
    "Database administrators and architects": ["15-1242", "15-1243"],
    "Geoscientists and hydrologists, except geographers": ["19-2042", "19-2043"],
    "Substance abuse and behavioral disorder counselors": ["21-1018"],
    "Mental health counselors": ["21-1018"],
    "Nuclear medicine technologists and medical dosimetrists": ["29-2033", "29-2036"],
    "Dietetic technicians and ophthalmic medical technicians": ["29-2051", "29-2057"],
    "Home health aides": ["31-1120"],
    "Personal care aides": ["31-1120"],
    "Orderlies and psychiatric aides": ["31-1132", "31-1133"],
    "Janitors and building cleaners": ["37-2011"],
    "Embalmers, crematory operators, and funeral attendants": ["39-4011", "39-4012", "39-4021"],
    "Electrical and electronics repairers, industrial and utility": ["49-2094", "49-2095"],
    "Industrial and refractory machinery mechanics": ["49-9041", "49-9045"],
    "Conveyor, dredge, and hoist and winch operators": ["53-7011", "53-7031", "53-7041"],
    # "Other ..." rows used only where the CPS group is clearly defined (the rest of one SOC group):
    "Other physicians": ["29-1211", "29-1212", "29-1213", "29-1215", "29-1216", "29-1217", "29-1218",
                         "29-1221", "29-1222", "29-1223", "29-1229"],
    "Other mathematical science occupations": ["15-2051", "15-2099"],
    "Other drafters": ["17-3012", "17-3013", "17-3019"],
    "Other engineering technologists and technicians, except drafters": ["17-3021", "17-3022", "17-3024", "17-3025",
                                                                         "17-3026", "17-3027", "17-3029"],
}

OWN = {"1": "federal", "2": "state", "3": "local", "123": "government", "5": "private"}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def num(v):
    """BLS cells: numbers, or '*', '**', '#', '–' for values not published. Whole numbers stay int."""
    if v is None or isinstance(v, str):
        try:
            v = float(str(v).replace(",", "")) if v not in (None, "") else None
        except ValueError:
            return None
        if v is None:
            return None
    v = float(v)
    return int(v) if v.is_integer() else v


def rows(path):
    return list(openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0].iter_rows(values_only=True))


def soc_index():
    """OEWS national SOC titles -> list of (code, group), and detailed codes under each group."""
    nat = rows(RAW / "national_M2025_dl.xlsx")
    h = nat[0]
    title, detailed = {}, []
    for r in nat[1:]:
        code, grp = r[h.index("OCC_CODE")], r[h.index("O_GROUP")]
        if grp in ("detailed", "broad", "minor"):
            title.setdefault(norm(r[h.index("OCC_TITLE")]), []).append((code, grp))
        if grp == "detailed":
            detailed.append(code)
    return title, detailed


def members(code, grp, detailed):
    if grp == "detailed":
        return [code]
    prefix = code[:6] if grp == "broad" else code[:4]  # 11-101x (broad 11-1010), 29-1xxx (minor 29-1000)
    return [d for d in detailed if d.startswith(prefix)]


def bls_soc(o):
    """The BLS SOC code this O*NET occupation's pay comes from (same link as build.py), else its first 7 chars."""
    return (o["wage"] or {}).get("bls_code") or o["code"][:7]


def build_age(occ):
    titles, detailed = soc_index()
    data = rows(CPS_FILE)
    assert "11b. Employed people by detailed occupation and age" in str(data[0][0]), "unexpected CPS file"
    assert str(data[3][1]) == "2025", "CPS file is not the 2025 annual average"
    total_row = next(r for r in data if r[0] == "Total employed")
    all_workers = {"total_k": total_row[1], "bands_k": dict(zip(AGE_BANDS, total_row[2:9])), "median_age": total_row[9]}

    by_soc, matches, skipped = {}, [], []
    for r in data[6:]:
        name = (r[0] or "").strip()
        if not name or r[1] is None or name.startswith("NOTE") or name == "Total employed":
            continue
        if name.startswith("Other ") and name not in CPS_MANUAL:
            skipped.append(name)
            continue
        if name in CPS_MANUAL:
            socs, how = CPS_MANUAL[name], "manual"
        else:
            hits = titles.get(norm(name), [])
            if not hits:
                skipped.append(name)  # major/summary groups, e.g. "Service occupations"
                continue
            code, grp = sorted(hits, key=lambda x: ["detailed", "broad", "minor"].index(x[1]))[0]
            socs, how = members(code, grp, detailed), grp
        rec = {"cps_title": name, "total_k": num(r[1]), "bands_k": dict(zip(AGE_BANDS, [num(x) for x in r[2:9]])),
               "median_age": num(r[9]), "covers": socs, "match": how}
        matches.append(rec)
        for s in socs:
            by_soc.setdefault(s, []).append(rec)

    out = {}
    for o in occ:
        recs = by_soc.get(bls_soc(o))
        if not recs:
            continue
        total = sum(x["total_k"] or 0 for x in recs)
        bands = {b: sum((x["bands_k"][b] or 0) for x in recs) for b in AGE_BANDS}
        combined = len(recs) > 1
        group = combined or len(recs[0]["covers"]) > 1
        enough = total >= CPS_MIN_TOTAL_K
        out[o["code"]] = {
            "cps_titles": [x["cps_title"] for x in recs],
            "total_k": total,
            "bands_k": bands,
            # median age cannot be recombined from several rows; only shown for a single published row
            "median_age": None if combined else recs[0]["median_age"],
            "share_45_plus": round((bands["45-54"] + bands["55-64"] + bands["65+"]) / total, 3) if enough and total else None,
            "share_55_plus": round((bands["55-64"] + bands["65+"]) / total, 3) if enough and total else None,
            "share_under_35": round((bands["16-19"] + bands["20-24"] + bands["25-34"]) / total, 3) if enough and total else None,
            "group": group,
            "enough_data": enough,
        }
    a = all_workers
    a["share_45_plus"] = round((a["bands_k"]["45-54"] + a["bands_k"]["55-64"] + a["bands_k"]["65+"]) / a["total_k"], 3)
    a["share_55_plus"] = round((a["bands_k"]["55-64"] + a["bands_k"]["65+"]) / a["total_k"], 3)
    nat = rows(RAW / "national_M2025_dl.xlsx")
    nh = nat[0]
    us = next(r for r in nat[1:] if r[nh.index("OCC_CODE")] == "00-0000")
    a["us_median_pay"] = num(us[nh.index("A_MEDIAN")])  # BLS OEWS May 2025, all occupations
    meta = {"source": "BLS Current Population Survey, 2025 annual averages (11 months, October not collected), Table 11b",
            "min_total_k": CPS_MIN_TOTAL_K, "cps_rows_used": len(matches), "cps_rows_skipped": skipped}
    return {"meta": meta, "all_workers": a, "careers": out}


def build_government(occ):
    data = rows(OWNER_FILE)
    h = data[0]
    i = {k: h.index(k) for k in ("OWN_CODE", "OCC_CODE", "O_GROUP", "TOT_EMP", "A_MEDIAN", "A_PCT10", "A_PCT90", "NAICS_TITLE")}
    cell = {}
    titles = {}
    for r in data[1:]:
        if r[i["O_GROUP"]] not in ("detailed", "total"):
            continue
        own = OWN.get(str(r[i["OWN_CODE"]]))
        titles[own] = r[i["NAICS_TITLE"]]
        cell[(r[i["OCC_CODE"]], own)] = {"employment": num(r[i["TOT_EMP"]]), "median": num(r[i["A_MEDIAN"]]),
                                         "p10": num(r[i["A_PCT10"]]), "p90": num(r[i["A_PCT90"]])}
    out = {}
    for o in occ:
        soc = bls_soc(o)
        parts = {k: cell.get((soc, k)) for k in OWN.values()}
        if not parts["government"]:
            continue
        g, p = parts["government"]["employment"], (parts["private"] or {}).get("employment")
        out[o["code"]] = {**{k: v for k, v in parts.items() if v}, "bls_code": soc,
                          "gov_share": round(g / (g + p), 3) if g is not None and p is not None and (g + p) else None,
                          "group": bool(o["wage"] and o["wage"]["is_group"])}
    meta = {"source": "BLS OEWS May 2025, national cross-industry estimates by ownership (oesm25in4)",
            "ownership_titles": titles, "all_occupations": {k: cell.get(("00-0000", k)) for k in OWN.values()}}
    return {"meta": meta, "careers": out}


def main():
    occ = [o for o in json.loads((P / "occupations.json").read_text()) if not o["thin"]]
    OUT.mkdir(parents=True, exist_ok=True)
    age = build_age(occ)
    gov = build_government(occ)
    for name, obj in (("age", age), ("government", gov)):
        (OUT / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False))
    a = age["careers"]
    print(f"age: {len(a)} careers matched, {sum(1 for v in a.values() if v['enough_data'])} with enough data, "
          f"{sum(1 for v in a.values() if v['group'])} via a broader group; CPS rows used {age['meta']['cps_rows_used']}, "
          f"skipped {len(age['meta']['cps_rows_skipped'])}")
    print(f"government: {len(gov['careers'])} careers with government employment")


if __name__ == "__main__":
    main()
