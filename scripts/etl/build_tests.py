"""Build data for the tests (Tahap 3). Run after build.py.

Writes to data/tests:
  career-attributes.json  per-career values used by Career Match and the College Major Quiz
  major-profiles.json     per-major interest profile and work-style values, from linked careers

All values come from O*NET 31.0 and BLS OEWS May 2025 via data/processed and data/raw/onet.
Attributes are percentile ranks (0-1) across the careers that get a full page, so answers
like "a lot" or "a little" compare you with the range of real jobs.
"""
import json
import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[2]
ONET = ROOT / "data" / "raw" / "onet" / "db_31_0_excel"
P = ROOT / "data" / "processed"
OUT = ROOT / "data" / "tests"

# attribute id -> (O*NET Work Context element(s), scale). Mean of elements when several.
CX_ATTRS = {
    "contact": ["Contact With Others"],
    "public": ["Deal With External Customers or the Public in General"],
    "lead": ["Coordinate or Lead Others in Accomplishing Work Activities"],
    "outdoors": ["Outdoors, Exposed to All Weather Conditions", "Outdoors, Under Cover"],
    "sitting": ["Spend Time Sitting"],
    "time_pressure": ["Time Pressure"],
    "hazard": ["Exposed to Hazardous Conditions", "Exposed to Hazardous Equipment"],
    "freedom": ["Freedom to Make Decisions"],
    "repetition": ["Importance of Repeating Same Tasks"],
}
# category share (CTP, 0-100): attribute id -> (element, category)
CTP_ATTRS = {
    "regular_schedule": ("Work Schedules", 1),       # Regular (established routine, set schedule)
    "long_hours": ("Duration of Typical Work Week", 3),  # More than 40 hours
}
# College Major Quiz: Big Five trait -> O*NET Work Styles (Impact scale WI)
TRAIT_STYLES = {
    "openness": ["Intellectual Curiosity", "Innovation"],
    "conscientiousness": ["Attention to Detail", "Dependability"],
}


def main():
    occ = [o for o in json.loads((P / "occupations.json").read_text()) if not o["thin"]]
    codes = [o["code"] for o in occ]
    wc = pd.read_excel(ONET / "Work Context.xlsx", engine="openpyxl")
    wc = wc[wc["O*NET-SOC Code"].isin(codes)]
    ws = pd.read_excel(ONET / "Work Styles.xlsx", engine="openpyxl")
    ws = ws[(ws["O*NET-SOC Code"].isin(codes)) & (ws["Scale ID"] == "WI")]

    raw = pd.DataFrame(index=codes)
    cx = wc[wc["Scale ID"] == "CX"].pivot_table(index="O*NET-SOC Code", columns="Element Name", values="Data Value")
    for k, els in CX_ATTRS.items():
        raw[k] = cx.reindex(codes)[els].mean(axis=1)
    ctp = wc[wc["Scale ID"] == "CTP"]
    for k, (el, cat) in CTP_ATTRS.items():
        s = ctp[(ctp["Element Name"] == el) & (ctp["Category"] == cat)].set_index("O*NET-SOC Code")["Data Value"]
        raw[k] = s.reindex(codes)
    # group wages (pay for a broader BLS group) are left out of pay ranking (Gate 2A)
    raw["pay"] = [None if o["wage"]["is_group"] else o["wage"]["median"] for o in occ]
    raw["pay"] = raw["pay"].astype(float)
    wsp = ws.pivot_table(index="O*NET-SOC Code", columns="Element Name", values="Data Value").reindex(codes)
    for t, styles in TRAIT_STYLES.items():
        raw[t] = wsp[styles].mean(axis=1)

    pct = raw.rank(pct=True, method="average")  # NaN stays NaN
    careers = []
    for o in occ:
        c = o["code"]
        careers.append({
            "code": c, "slug": o["slug"], "title": o["title"], "job_zone": o["job_zone"],
            "riasec": o["riasec"], "median": o["wage"]["median"], "wage_is_group": o["wage"]["is_group"],
            "attrs": {k: (None if pd.isna(v) else round(float(v), 3)) for k, v in pct.loc[c].items()},
        })
    meta = {
        "sources": ["O*NET 31.0 Work Context (CX, CTP)", "O*NET 31.0 Work Styles (WI)", "O*NET 31.0 Interests (OI)",
                    "BLS OEWS May 2025 median pay"],
        "note": "attrs are percentile ranks (0-1) across careers with a full page. riasec is the O*NET OI scale (1-7).",
        "cx_attrs": CX_ATTRS, "ctp_attrs": {k: list(v) for k, v in CTP_ATTRS.items()}, "trait_styles": TRAIT_STYLES,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "career-attributes.json").write_text(json.dumps({"meta": meta, "careers": careers}, ensure_ascii=False,
                                                           separators=(",", ":"), allow_nan=False))

    by_code = {c["code"]: c for c in careers}
    majors_out = []
    for m in json.loads((P / "majors.json").read_text()):
        linked = [by_code[c] for c in m["careers"] if c in by_code]
        if not linked:
            continue
        prof = {L: round(sum(c["riasec"][L] for c in linked) / len(linked), 3) for L in "RIASEC"}
        traits = {}
        for t in TRAIT_STYLES:
            vals = [c["attrs"][t] for c in linked if c["attrs"][t] is not None]
            traits[t] = round(sum(vals) / len(vals), 3) if vals else None
        majors_out.append({"cip": m["cip"], "title": m["title"], "slug": m["slug"],
                           "careers": [c["code"] for c in linked], "riasec": prof, "traits": traits})
    (OUT / "major-profiles.json").write_text(json.dumps({"note": "riasec = mean O*NET OI profile of linked careers; "
                                                         "traits = mean percentile of linked careers",
                                                         "majors": majors_out}, ensure_ascii=False,
                                                        separators=(",", ":"), allow_nan=False))
    missing = {k: int(raw[k].isna().sum()) for k in raw.columns}
    print(f"careers {len(careers)}, majors with careers {len(majors_out)}; missing values per attribute: {missing}")


if __name__ == "__main__":
    main()
