"""Data for the career-change situation pages (/career-change/at-[age], to-[field]). Run after build.py.

Sources (kept in data/raw/bls, downloaded by hand because bls.gov blocks automated downloads):
  cps/cpsaat11b_2025.xlsx                 BLS CPS 2025 annual averages, Table 11b: employed people by
                                          detailed occupation and age (thousands; 11-month average, no October)
  oesm25in4/national_owner_M2025_dl.xlsx  BLS OEWS May 2025, national cross-industry by ownership
                                          (federal, state, local government, private)

Writes data/processed/situations/age.json, government.json and remote.json, keyed by O*NET-SOC code.

remote.json is our estimate of which careers can mostly be done from home, from O*NET 31.0 Work Context
and Work Activities, following the method of Dingel & Neiman (2020), "How many jobs can be done at home?",
Journal of Public Economics 189. A career is remote-friendly when none of the conditions in REMOTE_BLOCKERS
applies. It is an estimate of what the work allows, not a count of remote job postings.

CPS occupations have titles but no SOC codes. They are matched to the BLS OEWS SOC titles
(case and punctuation ignored); titles that differ are listed in CPS_MANUAL below, each with the SOC
codes it covers. "Other ..." catch-all rows are not used. When a CPS row covers several SOC codes, or a
SOC code is covered by several CPS rows, the page says the figure is for a broader group.
"""
import json
import pathlib
import re

import openpyxl

import config as C

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


ONET = ROOT / "data" / "raw" / "onet" / "db_31_0_excel"
# Dingel & Neiman (2020) conditions; any one means the work cannot mostly be done at home.
# Work Context CX scale 1-5 (frequency: 3 = once a month, 4 = once a week; time: 4 = more than half the time).
REMOTE_CX = {
    "E-Mail": ("<", 3),  # used less than once a month
    "Dealing with Violent or Physically Aggressive People": (">=", 4),  # at least weekly
    "Exposed to Disease or Infections": (">=", 4),
    "Exposed to Minor Burns, Cuts, Bites, or Stings": (">=", 4),
    "Spend Time Walking or Running": (">=", 4),  # more than half the time
    "Wear Common Protective or Safety Equipment such as Safety Shoes, Glasses, Gloves, Hearing Protection, Hard Hats, or Life Jackets": (">=", 4),
    "Wear Specialized Protective or Safety Equipment such as Breathing Apparatus, Safety Harness, Full Protection Suits, or Radiation Protection": (">=", 4),
}
# majority of workers outdoors every day (CXP category 5 share above 50%)
REMOTE_OUTDOORS = ["Outdoors, Exposed to All Weather Conditions", "Outdoors, Under Cover"]
# Work Activities importance (IM, 1-5) of 4 or more = "very important"
REMOTE_GWA = [
    "Performing General Physical Activities",
    "Handling and Moving Objects",
    "Controlling Machines and Processes",
    "Operating Vehicles, Mechanized Devices, or Equipment",
    "Performing for or Working Directly with the Public",
    "Repairing and Maintaining Mechanical Equipment",
    "Repairing and Maintaining Electronic Equipment",
    "Inspecting Equipment, Structures, or Materials",
]
REMOTE_GWA_MIN = 4.0


TELEWORK_FILE = RAW / "cps" / "cpsaat62_2025.xlsx"
# SOC major group -> CPS Table 62 occupation row
TELEWORK_GROUPS = {
    "11": "Management occupations", "13": "Business and financial operations occupations",
    "15": "Computer and mathematical occupations", "17": "Architecture and engineering occupations",
    "19": "Life, physical, and social science occupations", "21": "Community and social services occupations",
    "23": "Legal occupations", "25": "Education, training, and library occupations",
    "27": "Arts, design, entertainment, sports, and media occupations",
    "29": "Healthcare practitioners and technical occupations", "31": "Healthcare support occupations",
    "33": "Protective service occupations", "35": "Food preparation and serving related occupations",
    "37": "Building and grounds cleaning and maintenance occupations", "39": "Personal care and service occupations",
    "41": "Sales and related occupations", "43": "Office and administrative support occupations",
    "45": "Farming, fishing, and forestry occupations", "47": "Construction and extraction occupations",
    "49": "Installation, maintenance, and repair occupations", "51": "Production occupations",
    "53": "Transportation and material moving occupations",
}


def build_telework():
    data = rows(TELEWORK_FILE)
    assert "62. Average weekly hours of work and percent of hours teleworked" in str(data[0][0]), "unexpected file"
    assert "2025 Annual Averages" in str(data[0][0]), "not the 2025 annual averages"
    by_title = {str(r[0]).strip(): r for r in data if r[0]}
    def rec(r):
        return {"title": str(r[0]).strip(), "at_work_k": num(r[1]), "teleworkers_k": num(r[5]),
                "share_teleworked": round(num(r[5]) / num(r[1]), 3), "pct_hours_teleworked": num(r[4])}
    total = rec(by_title["Total, 16 years and over"])
    groups = {soc: rec(by_title[t]) for soc, t in TELEWORK_GROUPS.items()}
    return total, groups


INDUSTRY_FILE = RAW / "oesm25in4" / "nat4d_M2025_dl.xlsx"
# "Career change to oil and gas": the two oil-and-gas-only NAICS industries in the OEWS 4-digit file
INDUSTRIES = {"211100": "oil-gas-extraction", "486100": "crude-oil-pipelines", "486200": "natural-gas-pipelines"}


def build_industries():
    out = {}
    wb = openpyxl.load_workbook(INDUSTRY_FILE, read_only=True)
    it = wb.worksheets[0].iter_rows(values_only=True)
    h = next(it)
    i = {k: h.index(k) for k in ("NAICS", "NAICS_TITLE", "OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", "A_MEDIAN", "A_PCT10", "A_PCT90", "PCT_TOTAL")}
    for r in it:
        n = str(r[i["NAICS"]])
        if n not in INDUSTRIES:
            continue
        d = out.setdefault(n, {"naics": n, "title": r[i["NAICS_TITLE"]], "slug": INDUSTRIES[n], "occupations": []})
        rec = {"soc": r[i["OCC_CODE"]], "title": r[i["OCC_TITLE"]], "employment": num(r[i["TOT_EMP"]]), "median": num(r[i["A_MEDIAN"]]),
               "p10": num(r[i["A_PCT10"]]), "p90": num(r[i["A_PCT90"]]), "pct_of_industry": num(r[i["PCT_TOTAL"]])}
        if r[i["O_GROUP"]] == "total":
            d["total"] = rec
        elif r[i["O_GROUP"]] == "detailed":
            d["occupations"].append(rec)
    for d in out.values():
        d["occupations"].sort(key=lambda x: -(x["employment"] or 0))
    return {"meta": {"source": "BLS OEWS May 2025, national industry-specific estimates (4-digit NAICS)"}, "industries": out}


def build_remote(occ):
    codes = {o["code"] for o in occ}
    cx, cxp, im = {}, {}, {}
    wc = rows(ONET / "Work Context.xlsx")
    h = wc[0]
    ic, ie, isc, icat, iv = (h.index(k) for k in ("O*NET-SOC Code", "Element Name", "Scale ID", "Category", "Data Value"))
    for r in wc[1:]:
        if r[ic] not in codes:
            continue
        if r[isc] == "CX" and r[ie] in REMOTE_CX:
            cx[(r[ic], r[ie])] = float(r[iv])
        elif r[isc] == "CXP" and r[ie] in REMOTE_OUTDOORS and str(r[icat]) in ("5", "5.0"):
            cxp[(r[ic], r[ie])] = float(r[iv])
    wa = rows(ONET / "Work Activities.xlsx")
    h = wa[0]
    ic, ie, isc, iv = (h.index(k) for k in ("O*NET-SOC Code", "Element Name", "Scale ID", "Data Value"))
    for r in wa[1:]:
        if r[ic] in codes and r[isc] == "IM" and r[ie] in REMOTE_GWA:
            im[(r[ic], r[ie])] = float(r[iv])
    out = {}
    for c in sorted(codes):
        if not any((c, e) in cx for e in REMOTE_CX) and not any((c, e) in im for e in REMOTE_GWA):
            continue  # no O*NET context data for this career
        blockers = []
        for e, (op, t) in REMOTE_CX.items():
            v = cx.get((c, e))
            if v is not None and (v < t if op == "<" else v >= t):
                blockers.append(e)
        for e in REMOTE_OUTDOORS:
            if cxp.get((c, e), 0) > 50:
                blockers.append(e + " (every day, most workers)")
        for e in REMOTE_GWA:
            if im.get((c, e), 0) >= REMOTE_GWA_MIN:
                blockers.append(e)
        out[c] = {"remote_friendly": not blockers, "blockers": blockers}
    total, groups = build_telework()
    meta = {"telework_source": "BLS Current Population Survey, 2025 annual averages (11 months), Table 62",
            "telework_total": total, "telework_groups": groups,
            "method": "Dingel & Neiman (2020), applied to O*NET 31.0",
            # long licensed professions (same list as the career-change matches) are not career-change targets
            "licensed_prefixes": list(C.HEAVY_LICENSE_PREFIXES), "cx": {k: list(v) for k, v in REMOTE_CX.items()},
            "outdoors_every_day_share_above": 50, "gwa_importance_min": REMOTE_GWA_MIN, "gwa": REMOTE_GWA}
    return {"meta": meta, "careers": out}


def main():
    occ = [o for o in json.loads((P / "occupations.json").read_text()) if not o["thin"]]
    OUT.mkdir(parents=True, exist_ok=True)
    age = build_age(occ)
    gov = build_government(occ)
    remote = build_remote(occ)
    industries = build_industries()
    for name, obj in (("age", age), ("government", gov), ("remote", remote), ("industries", industries)):
        (OUT / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False))
    a = age["careers"]
    print(f"age: {len(a)} careers matched, {sum(1 for v in a.values() if v['enough_data'])} with enough data, "
          f"{sum(1 for v in a.values() if v['group'])} via a broader group; CPS rows used {age['meta']['cps_rows_used']}, "
          f"skipped {len(age['meta']['cps_rows_skipped'])}")
    print(f"government: {len(gov['careers'])} careers with government employment")
    print("industries:", {k: (v["title"], v.get("total", {}).get("employment"), len(v["occupations"])) for k, v in industries["industries"].items()})
    r = remote["careers"]
    print(f"remote: {sum(1 for v in r.values() if v['remote_friendly'])} of {len(r)} careers remote-friendly")


if __name__ == "__main__":
    main()
