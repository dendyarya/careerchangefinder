"""Build data/processed/*.json from O*NET, BLS and NCES raw files.

Usage:
    python scripts/etl/download.py   # once, fetches O*NET + NCES
    python scripts/etl/build.py      # writes data/processed and docs/data-report.md

Raw files are never modified.
"""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import re
import shutil

import numpy as np
import pandas as pd

import config as C

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
ONET = RAW / "onet" / f"db_{C.ONET_VERSION}_excel"
OUT = ROOT / "data" / "processed"
DOCS = ROOT / "docs"


# ---------------------------------------------------------------- loading

def onet(name: str) -> pd.DataFrame:
    df = pd.read_excel(ONET / f"{name}.xlsx", engine="openpyxl")
    df.columns = [c.strip() for c in df.columns]
    return df


def profile(df: pd.DataFrame, scale: str) -> pd.DataFrame:
    """Pivot an O*NET element file into occupation x element values for one scale."""
    sub = df[df["Scale ID"] == scale]
    return sub.pivot_table(index="O*NET-SOC Code", columns="Element Name",
                           values="Data Value", aggfunc="mean")


def money(v):
    if isinstance(v, (int, float)) and not pd.isna(v):
        return int(round(v))
    return None


def load_bls():
    nat = pd.read_excel(RAW / "bls" / C.BLS_NATIONAL, engine="openpyxl")
    nat = nat[nat["O_GROUP"] == "detailed"]
    wages = {}
    for _, r in nat.iterrows():
        wages[r["OCC_CODE"]] = {
            "bls_code": r["OCC_CODE"], "bls_title": r["OCC_TITLE"],
            "median": money(r["A_MEDIAN"]), "p10": money(r["A_PCT10"]),
            "p25": money(r["A_PCT25"]), "p75": money(r["A_PCT75"]),
            "p90": money(r["A_PCT90"]),
            "employment": money(r["TOT_EMP"]),
            "top_coded": r["A_MEDIAN"] == "#",
        }
    st = pd.read_excel(RAW / "bls" / C.BLS_STATE, engine="openpyxl")
    st = st[(st["O_GROUP"] == "detailed") & (~st["AREA_TITLE"].isin(["Guam", "Puerto Rico", "Virgin Islands"]))]
    states = {}
    for _, r in st.iterrows():
        med = money(r["A_MEDIAN"])
        if med is None:
            continue
        states.setdefault(r["OCC_CODE"], []).append({
            "state": r["AREA_TITLE"], "abbr": r["PRIM_STATE"], "median": med,
            "p10": money(r["A_PCT10"]), "p90": money(r["A_PCT90"]),
            "employment": money(r["TOT_EMP"]),
        })
    for v in states.values():
        v.sort(key=lambda x: -x["median"])
    return wages, states


# ---------------------------------------------------------------- helpers

def slugify(title: str) -> str:
    base = title.split(",")[0]
    base = base.replace("&", " and ").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base


def pearson_matrix(a: pd.DataFrame, b: pd.DataFrame) -> pd.DataFrame:
    cols = a.columns.intersection(b.columns)
    A = a[cols].astype(float)
    B = b[cols].astype(float)
    A = A.sub(A.mean(axis=1), axis=0)
    B = B.sub(B.mean(axis=1), axis=0)
    A = A.div(np.sqrt((A ** 2).sum(axis=1)).replace(0, np.nan), axis=0)
    B = B.div(np.sqrt((B ** 2).sum(axis=1)).replace(0, np.nan), axis=0)
    return pd.DataFrame(A.values @ B.values.T, index=A.index, columns=B.index)


def mode_category(df: pd.DataFrame, code: str, element: str, scale: str, labels: dict):
    sub = df[(df["O*NET-SOC Code"] == code) & (df["Element Name"] == element) & (df["Scale ID"] == scale)]
    if sub.empty:
        return None
    best = sub.loc[sub["Data Value"].idxmax()]
    cat = int(best["Category"])
    return {"category": cat, "label": labels.get((element, scale, cat)), "pct": round(float(best["Data Value"]), 1)}


# ---------------------------------------------------------------- build

def main() -> None:
    print("Loading O*NET ...")
    occ = onet("Occupation Data")
    titles = dict(zip(occ["O*NET-SOC Code"], occ["Title"]))
    desc = dict(zip(occ["O*NET-SOC Code"], occ["Description"]))

    ts = onet("Transferable Skills")
    skills_im = profile(ts, "IM")
    kn_im = profile(onet("Knowledge"), "IM")
    wa_im = profile(onet("Work Activities"), "IM")
    ci = onet("Career Interest Types")
    riasec = profile(ci, "OI")
    jz = dict(zip(*[onet("Job Zones")[c] for c in ("O*NET-SOC Code", "Job Zone")]))
    rel = onet("Related Occupations")
    edu = onet("Education")
    edu_cat = onet("Education Categories")
    tr = onet("Training and Experience")
    tr_cat = onet("Training and Experience Categories")
    wc = onet("Work Context")
    ws = onet("Work Styles")
    es = onet("Essential Skills")
    tasks = onet("Task Statements")
    alt = onet("Job Titles")

    labels = {}
    for df in (edu_cat, tr_cat):
        for _, r in df.iterrows():
            # pandas reads the literal text "None" as missing; restore it
            desc_text = "None" if pd.isna(r["Category Description"]) else r["Category Description"]
            labels[(r["Element Name"], r["Scale ID"], int(r["Category"]))] = desc_text

    print("Loading BLS ...")
    wages, states = load_bls()

    # map O*NET codes to BLS wage rows
    soc_members = {}
    for code in titles:
        soc_members.setdefault(code[:7], []).append(code)

    def wage_for(code):
        w = wages.get(code[:7])
        if not w:
            return None
        members = [m for m in soc_members.get(code[:7], []) if m in titles]
        group = len(members) > 1 and w["bls_title"].strip().lower() != titles[code].strip().lower()
        return {**w, "is_group": bool(group)}

    # slugs
    slugs, used = {}, set()
    for code in sorted(titles):
        s = slugify(titles[code])
        if s in used:
            s = f"{s}-{code[:7].replace('-', '')}{code[8:]}"
        used.add(s)
        slugs[code] = s

    # thin flag
    have = set(skills_im.index) & set(kn_im.index) & set(wa_im.index) & set(riasec.index)
    occ_wage = {c: wage_for(c) for c in titles}
    thin = {c: (c not in have) or (occ_wage[c] is None) or (occ_wage[c]["median"] is None)
            or ("All Other" in titles[c]) for c in titles}

    # interest code
    letters = {"Realistic": "R", "Investigative": "I", "Artistic": "A", "Social": "S",
               "Enterprising": "E", "Conventional": "C"}
    holland = {}
    for c, row in riasec.iterrows():
        top = row.sort_values(ascending=False).index[:3]
        holland[c] = "".join(letters[t] for t in top)

    # first steps
    cert = edu[(edu["Element Name"] == "Job-Related Professional Certification") & (edu["Scale ID"] == "IM")]
    cert = dict(zip(cert["O*NET-SOC Code"], cert["Data Value"]))

    print("Preparing per-occupation details ...")
    edu_idx = edu.groupby("O*NET-SOC Code")
    tr_idx = tr.groupby("O*NET-SOC Code")

    def first_step(code):
        out = {"job_zone": jz.get(code), "education_label": C.JOB_ZONE_LABEL.get(jz.get(code))}
        if code in edu_idx.groups:
            e = edu_idx.get_group(code)
            out["typical_education"] = mode_category(e, code, "Required Level of Education", "RL", labels)
        if code in tr_idx.groups:
            t = tr_idx.get_group(code)
            out["on_the_job_training"] = mode_category(t, code, "On-the-Job Training", "OJ", labels)
            out["related_experience"] = mode_category(t, code, "Related Work Experience", "RW", labels)
        c = cert.get(code)
        if c is not None and not pd.isna(c):
            out["certification_importance"] = round(float(c), 2)
            out["certification_note"] = ("A professional certification is often expected" if c >= 3.5
                                         else "A certification can help" if c >= 2.5 else None)
        return out

    wc_cx = wc[(wc["Scale ID"] == "CX") & (wc["Element Name"].isin(list(C.DOWNSIDE_FACTORS) + ["Contact With Others"]))]
    wc_cx = wc_cx.pivot_table(index="O*NET-SOC Code", columns="Element Name", values="Data Value", aggfunc="mean")

    def downsides(code):
        if code not in wc_cx.index:
            return []
        row = wc_cx.loc[code]
        items = [(k, float(row[k])) for k in C.DOWNSIDE_FACTORS if k in row and not pd.isna(row[k]) and row[k] >= C.DOWNSIDE_THRESHOLD]
        items.sort(key=lambda x: -x[1])
        return [{"factor": k, "label": C.DOWNSIDE_FACTORS[k], "value": round(v, 2)} for k, v in items[:3]]

    # top tasks by importance
    tr_ratings = onet("Task Ratings")
    tr_ratings = tr_ratings[tr_ratings["Scale ID"] == "IM"][["O*NET-SOC Code", "Task ID", "Data Value"]]
    tasks = tasks.merge(tr_ratings, on=["O*NET-SOC Code", "Task ID"], how="left")
    top_tasks = (tasks.sort_values(["O*NET-SOC Code", "Data Value"], ascending=[True, False])
                 .groupby("O*NET-SOC Code")["Task"].apply(lambda s: list(s)[:8]).to_dict())

    def top_elements(df, code, n, scale="IM"):
        sub = df[(df["O*NET-SOC Code"] == code) & (df["Scale ID"] == scale)].sort_values("Data Value", ascending=False)
        return [{"name": r["Element Name"], "value": round(float(r["Data Value"]), 2)} for _, r in sub.head(n).iterrows()]

    alt_titles = alt.groupby("O*NET-SOC Code")["Job Title"].apply(lambda s: list(dict.fromkeys(s))[:10]).to_dict()

    # majors from crosswalk
    cw = pd.read_excel(RAW / "nces" / "CIP2020_SOC2018_Crosswalk.xlsx", sheet_name="CIP-SOC", engine="openpyxl", dtype=str)
    cw = cw[cw["SOC2018Code"] != "99-9999"]
    soc_to_majors = cw.groupby("SOC2018Code").apply(lambda d: list(zip(d["CIP2020Code"], d["CIP2020Title"].str.rstrip(".")))).to_dict()

    # ------------------------------------------------ similarity
    print("Computing similarity ...")
    codes = sorted(have)
    hubs = {f"hub:{k}": v for k, v in C.HUBS.items()}

    def hub_profile(df, members):
        return df.loc[[m for m in members if m in df.index]].mean()

    src_frames = {}
    for name, df in (("skills", skills_im), ("knowledge", kn_im), ("activities", wa_im), ("interests", riasec)):
        base = df.loc[codes]
        extra = pd.DataFrame({h: hub_profile(df, v["codes"]) for h, v in hubs.items()}).T
        src_frames[name] = pd.concat([base, extra])

    corr = {name: pearson_matrix(src_frames[name], src_frames[name].loc[codes]) for name in src_frames}
    sources = list(corr["skills"].index)
    # base score matrix (sources x targets), 0-100
    base = sum(C.WEIGHTS[k] * np.clip(corr[k].loc[sources, codes].values, 0, None)
               for k in ("skills", "knowledge", "activities", "interests"))
    base_df = pd.DataFrame(base * 100, index=sources, columns=codes)

    rel_bonus = {}
    for _, r in rel.iterrows():
        rel_bonus[(r["O*NET-SOC Code"], r["Related O*NET-SOC Code"])] = C.RELATED_TIER_BONUS.get(r["Relatedness Tier"], 0)

    t_jz = np.array([jz.get(t) or 0 for t in codes])
    def usable_pay(code):
        w = occ_wage.get(code)
        if not w or not w["median"]:
            return None
        if w["is_group"] and not C.GROUP_WAGE_IN_PAY_CHANGE:
            return None
        return w["median"]

    # Penalty pay: a group wage still counts against big drops (no bonus exists, so an
    # inflated group wage cannot push a career up). It is never shown as "pay change".
    t_pay = np.array([float(occ_wage[t]["median"]) if (not thin[t] and occ_wage.get(t) and occ_wage[t]["median"]) else np.nan
                      for t in codes])
    t_thin = np.array([thin[t] for t in codes])
    t_heavy = np.array([any(t.startswith(p) for p in C.HEAVY_LICENSE_PREFIXES) for t in codes])
    t_minor = np.array([t[:4] for t in codes])
    t_titles = [titles[t] for t in codes]
    up_pen = np.vectorize(lambda d: C.JOB_ZONE_UP_PENALTY.get(int(d), 30) if d > 0 else 0)
    down_pen = np.vectorize(lambda d: C.JOB_ZONE_DOWN_PENALTY.get(int(-d), 20) if d < 0 else 0)

    def members_of(src):
        return C.HUBS[src[4:]]["codes"] if src.startswith("hub:") else [src]

    def src_jz(src):
        z = [jz.get(m) for m in members_of(src) if jz.get(m)]
        return max(set(z), key=z.count) if z else None

    def src_pay(src):
        ws_ = [(usable_pay(m), occ_wage[m]["employment"] or 1) for m in members_of(src) if usable_pay(m)]
        if not ws_:
            return None
        return int(round(sum(a * b for a, b in ws_) / sum(b for _, b in ws_)))

    def heavy(code):
        return any(code.startswith(p) for p in C.HEAVY_LICENSE_PREFIXES)

    def transitions(src):
        mem = members_of(src)
        minor = {m[:4] for m in mem}
        keywords = C.HUBS[src[4:]].get("field_keywords", []) if src.startswith("hub:") else []
        szone = src_jz(src)
        spay = src_pay(src)
        skill_src = src_frames["skills"].loc[src]
        score = base_df.loc[src].values.copy()
        score += 100 * C.WEIGHTS["related"] * np.array([max((rel_bonus.get((m, t), 0) for m in mem), default=0) for t in codes])
        if szone:
            diff = np.where(t_jz > 0, t_jz - szone, 0)
            score -= up_pen(diff) + down_pen(diff)
        if spay:
            change = (t_pay - spay) / spay * 100
            drop = np.clip(-change - C.PAY_DROP_FREE_PCT, 0, None) * C.PAY_DROP_POINTS_PER_PCT
            score -= np.nan_to_num(np.clip(drop, 0, C.PAY_DROP_MAX_PENALTY))
        same = np.array([(t_minor[i] in minor) or any(k.lower() in t_titles[i].lower() for k in keywords) for i in range(len(codes))])
        keep = ~t_thin & ~np.isin(codes, mem) & ~(t_heavy & ~same)
        order = [i for i in np.argsort(-score) if keep[i]]
        out, field = [], []
        for i in order:
            bucket = field if same[i] else out
            if (bucket is out and len(out) >= C.TOP_N) or (bucket is field and len(field) >= 10):
                if len(out) >= C.TOP_N and len(field) >= 10:
                    break
                continue
            t = codes[i]
            tz = jz.get(t)
            gaps = (skills_im.loc[t] - skill_src).dropna().sort_values(ascending=False)
            w = occ_wage[t]
            item = {
                "code": t, "slug": slugs[t], "title": titles[t],
                "match": int(max(0, min(99, round(float(score[i]))))),
                "median": w["median"],
                "pay_change_pct": None if (not spay or not usable_pay(t)) else int(round((usable_pay(t) - spay) / spay * 100)),
                "job_zone": tz, "education_label": C.JOB_ZONE_LABEL.get(tz),
                "wage_is_group": w["is_group"], "wage_source_title": w["bls_title"],
                "skill_gaps": [g for g, v in gaps.items() if v >= 0.25][:3],
                "holland": holland.get(t),
            }
            bucket.append(item)
        return {"baseline_median": spay, "job_zone": szone, "top": out[:C.TOP_N], "similar_in_field": field[:10]}

    # ------------------------------------------------ write
    if OUT.exists():
        shutil.rmtree(OUT)
    for sub in ("transitions", "wages", "hubs", "indexes"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)

    def dump(path, obj):
        # allow_nan=False: fail loudly instead of writing invalid JSON
        path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False))

    print("Writing occupations ...")

    def top_by_code(df, n):
        d = df[df["Scale ID"] == "IM"].sort_values("Data Value", ascending=False)
        d = d.groupby("O*NET-SOC Code").head(n)
        return {c: [{"name": a, "value": round(float(b), 2)} for a, b in zip(g["Element Name"], g["Data Value"])]
                for c, g in d.groupby("O*NET-SOC Code")}

    ts_top = top_by_code(ts, 8)
    es_top = top_by_code(es, 6)
    occupations = []
    for code in sorted(titles):
        w = occ_wage[code]
        r = riasec.loc[code].to_dict() if code in riasec.index else {}
        rec = {
            "code": code, "slug": slugs[code], "title": titles[code], "description": desc[code],
            "alt_titles": alt_titles.get(code, []), "thin": thin[code],
            "job_zone": jz.get(code), "holland": holland.get(code),
            "riasec": {letters[k]: round(float(v), 2) for k, v in r.items()},
            "wage": None if not w else {k: w[k] for k in ("median", "p10", "p25", "p75", "p90", "employment", "is_group", "bls_code", "bls_title", "top_coded")},
            "first_step": first_step(code),
            "downsides": downsides(code),
            "contact_with_others": None if code not in wc_cx.index or pd.isna(wc_cx.at[code, "Contact With Others"]) else round(float(wc_cx.at[code, "Contact With Others"]), 2),
            "tasks": top_tasks.get(code, [])[:8],
            "transferable_skills": ts_top.get(code, []),
            "essential_skills": es_top.get(code, []),
            "knowledge": [],      # filled below
            "work_styles": [],    # filled below
            "majors": [{"cip": a, "title": b} for a, b in soc_to_majors.get(code[:7], [])][:12],
        }
        occupations.append(rec)
    # knowledge and work styles (separate pass for speed)
    kn_long = onet("Knowledge")
    kn_long = kn_long[kn_long["Scale ID"] == "IM"].sort_values("Data Value", ascending=False)
    kn_top = kn_long.groupby("O*NET-SOC Code").head(6).groupby("O*NET-SOC Code").apply(
        lambda d: [{"name": n, "value": round(float(v), 2)} for n, v in zip(d["Element Name"], d["Data Value"])]).to_dict()
    # Work styles that stand out for this job: O*NET Distinctiveness Rank (DR, 0-10) above 0,
    # highest first; ties broken by Work Styles Impact (WI). Max 5.
    ws_p = ws.pivot_table(index=["O*NET-SOC Code", "Element Name"], columns="Scale ID", values="Data Value").reset_index()
    ws_p = ws_p[ws_p["DR"] > 0].sort_values(["O*NET-SOC Code", "DR", "WI"], ascending=[True, False, False])
    ws_top = ws_p.groupby("O*NET-SOC Code").head(5).groupby("O*NET-SOC Code")["Element Name"].apply(list).to_dict()
    for rec in occupations:
        rec["knowledge"] = kn_top.get(rec["code"], [])
        rec["work_styles"] = ws_top.get(rec["code"], [])
    dump(OUT / "occupations.json", occupations)

    print("Writing wages ...")
    for code in titles:
        w = occ_wage[code]
        if w and code[:7] in states:
            dump(OUT / "wages" / f"{slugs[code]}.json", {"code": code, "bls_code": code[:7], "states": states[code[:7]]})

    print("Writing transitions ...")
    for code in codes:
        if thin[code]:
            continue
        dump(OUT / "transitions" / f"{slugs[code]}.json", {"code": code, "title": titles[code], **transitions(code)})
    hub_out = {}
    for key, h in C.HUBS.items():
        data = transitions(f"hub:{key}")
        hub_out[key] = {"slug": key, **{k: h[k] for k in ("singular", "plural", "codes")}, "baseline_median": data["baseline_median"]}
        dump(OUT / "hubs" / f"{key}.json", {"slug": key, **h, **data})
    dump(OUT / "hubs.json", hub_out)

    print("Writing majors and indexes ...")
    majors = {}
    for soc, lst in soc_to_majors.items():
        for cip, title in lst:
            majors.setdefault(cip, {"cip": cip, "title": title, "slug": slugify(title), "careers": []})
            for code in soc_members.get(soc, []):
                if not thin.get(code, True):
                    majors[cip]["careers"].append(code)
    majors = [m for m in majors.values() if m["careers"]]
    dump(OUT / "majors.json", sorted(majors, key=lambda m: m["cip"]))

    good = [o for o in occupations if not o["thin"]]
    idx_h = {}
    for o in good:
        idx_h.setdefault(o["holland"][:1], []).append(o["code"])
    dump(OUT / "indexes" / "holland.json", idx_h)
    idx_z = {}
    for o in good:
        idx_z.setdefault(str(o["job_zone"]), []).append(o["code"])
    dump(OUT / "indexes" / "job_zone.json", idx_z)
    idx_g = {}
    for o in good:
        idx_g.setdefault(o["code"][:2], []).append(o["code"])
    dump(OUT / "indexes" / "soc_major_group.json", idx_g)
    contact = sorted([o for o in good if o["contact_with_others"] is not None], key=lambda o: o["contact_with_others"])
    dump(OUT / "indexes" / "least_contact.json", [o["code"] for o in contact])
    # group wages are left out of pay rankings (Gate 2A)
    pay_sorted = sorted([o for o in good if not o["wage"]["is_group"]], key=lambda o: -(o["wage"]["median"] or 0))
    dump(OUT / "indexes" / "highest_pay.json", [o["code"] for o in pay_sorted])

    dump(OUT / "search-index.json", [{"s": o["slug"], "t": o["title"], "a": o["alt_titles"][:8]} for o in good])

    meta = {
        "built_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "sources": {"onet": C.ONET_LABEL, "bls": C.BLS_LABEL, "nces": C.NCES_LABEL},
        "attribution": C.ATTRIBUTION,
        "weights": C.WEIGHTS, "job_zone_up_penalty": C.JOB_ZONE_UP_PENALTY,
        "job_zone_down_penalty": C.JOB_ZONE_DOWN_PENALTY,
        "pay_drop": {"free_pct": C.PAY_DROP_FREE_PCT, "points_per_pct": C.PAY_DROP_POINTS_PER_PCT,
                     "max_penalty": C.PAY_DROP_MAX_PENALTY},
        "group_wage_in_pay_change": C.GROUP_WAGE_IN_PAY_CHANGE,
        "counts": {"occupations": len(occupations), "not_thin": len(good), "majors": len(majors),
                   "transitions": len(list((OUT / "transitions").glob("*.json"))),
                   "wage_files": len(list((OUT / "wages").glob("*.json"))), "hubs": len(C.HUBS)},
    }
    dump(OUT / "meta.json", meta)
    print(json.dumps(meta["counts"], indent=2))


if __name__ == "__main__":
    main()
