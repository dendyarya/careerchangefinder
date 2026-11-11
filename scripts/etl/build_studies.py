"""Data studies (research pages). Run after build.py. Writes data/processed/studies/<slug>.json.

better-paying-careers: "How many U.S. jobs have a close career that pays at least 10% more, with no extra
preparation?" For every career with its own BLS median (no broader-group wage) we look at its 25 closest
career-change matches (data/processed/transitions, the same lists the site shows) and keep a match when
  - it has its own BLS median in the same area (nation or state),
  - it usually needs no more preparation (O*NET Job Zone not higher than the current job's),
  - it is not a manager or supervisor role (SOC 11-* or "supervisor" in the title: usually filled by promotion),
  - its median is at least 10% above the current job's median in the same area.
A job "has a better-paying move" when at least one match qualifies. "Closest" = the qualifying match with the
highest match score (the list order). Shares are of jobs (careers) and of workers (BLS employment).
Every number is recomputed from the processed files by scripts/etl/verify_studies.py.

same-job-different-pay: "How much does the state change the pay for the same job?" Careers with their own
national BLS median (no broader-group wage, not top-coded). A state figure is used only when BLS publishes a
median and an employment estimate of at least 100 with a relative standard error of 25% or less (reliable rows).
- Per career, with reliable figures in at least 30 states: the highest and lowest state median and the gap
  (highest / lowest - 1).
- Per state: the same-job pay index, the employment-weighted median (state employment) of state median /
  national median - 1 over every career with a reliable figure in that state; the share of those careers that pay
  above the national median; and the number of careers (30+ states) where the state pays the most.
Also writes public/research/same-job-different-pay-*.csv for reuse.
"""
import csv
import json
import pathlib
import statistics

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / "data" / "processed"
OUT = P / "studies"

RAISE_MIN = 0.10
TOP_N = 25


def is_promotion(code: str, title: str) -> bool:
    return code.startswith("11-") or "supervisor" in title.lower()


def load():
    occ = {o["slug"]: o for o in json.loads((P / "occupations.json").read_text())}
    tr = {f.stem: json.loads(f.read_text()) for f in sorted((P / "transitions").glob("*.json"))}
    states = {}
    for f in sorted((P / "wages").glob("*.json")):
        d = json.loads(f.read_text())
        states[f.stem] = {s["abbr"]: s for s in d["states"] if s.get("median")}
    return occ, tr, states


def own_wage(o):
    w = o.get("wage")
    return w if w and not w["is_group"] and w.get("median") else None


def qualifying(src_slug, v, occ, pay_of):
    """Qualifying matches for one job in one area, in list (match score) order. pay_of(slug) -> (median, emp) | None."""
    base = pay_of(src_slug)
    if not base:
        return None, []
    out = []
    for t in v["top"][:TOP_N]:
        to = occ.get(t["slug"])
        if not to or not own_wage(to) or is_promotion(t["code"], t["title"]):
            continue
        if t["job_zone"] and v["job_zone"] and t["job_zone"] > v["job_zone"]:
            continue
        p = pay_of(t["slug"])
        if not p:
            continue
        r = p[0] / base[0] - 1
        if p[0] * 100 >= base[0] * round(100 * (1 + RAISE_MIN)):  # exact integer test; "at least 10%" includes 10.0%
            out.append({"slug": t["slug"], "title": t["title"], "match": t["match"], "median": p[0], "raise": round(r, 4), "_raw": r})
    return base, out


def area(occ, tr, pay_of):
    jobs = has = 0
    workers = workers_has = 0
    closest = []
    per_job = {}
    for s, v in tr.items():
        if not own_wage(occ[s]):
            continue
        base, q = qualifying(s, v, occ, pay_of)
        if not base:
            continue
        jobs += 1
        workers += base[1] or 0
        if q:
            has += 1
            workers_has += base[1] or 0
            closest.append(q[0]["_raw"])
        per_job[s] = (base, q)
    return {
        "jobs": jobs,
        "jobs_with_move": has,
        "share_jobs": round(has / jobs, 4) if jobs else None,
        "workers": workers,
        "workers_with_move": workers_has,
        "share_workers": round(workers_has / workers, 4) if workers else None,
        "median_closest_raise": round(statistics.median(closest), 4) if closest else None,
    }, per_job


MIN_EMP, MAX_RSE, MIN_STATES = 100, 25, 30


def reliable(s):
    return bool(s.get("median")) and (s.get("employment") or 0) >= MIN_EMP and s.get("emp_rse") is not None and s["emp_rse"] <= MAX_RSE


def weighted_median(pairs):
    """pairs: (value, weight). Smallest value at which the running weight reaches half the total."""
    pairs = sorted(pairs)
    total = sum(w for _, w in pairs)
    run = 0
    for v, w in pairs:
        run += w
        if run * 2 >= total:
            return v
    return None


def same_job_pay(occ):
    careers, by_state, names = [], {}, {}
    for f in sorted((P / "wages").glob("*.json")):
        o = occ.get(f.stem)
        if not o or o["thin"]:
            continue
        w = own_wage(o)
        if not w or w.get("top_coded"):
            continue
        rows = [s for s in json.loads(f.read_text())["states"] if reliable(s)]
        for r in rows:
            names[r["abbr"]] = r["state"]
            by_state.setdefault(r["abbr"], []).append((r["median"] / w["median"], r["employment"], f.stem))
        if len(rows) >= MIN_STATES:
            hi = max(rows, key=lambda r: (r["median"], r["abbr"]))
            lo = min(rows, key=lambda r: (r["median"], r["abbr"]))
            careers.append({"slug": f.stem, "title": o["title"], "median": w["median"], "employment": w["employment"],
                            "states": len(rows), "high": {"abbr": hi["abbr"], "state": hi["state"], "median": hi["median"]},
                            "low": {"abbr": lo["abbr"], "state": lo["state"], "median": lo["median"]},
                            "gap": round(hi["median"] / lo["median"] - 1, 4)})
    tops = {}
    for c in careers:
        tops[c["high"]["abbr"]] = tops.get(c["high"]["abbr"], 0) + 1
    states = []
    for a, v in by_state.items():
        states.append({"abbr": a, "state": names[a], "careers": len(v),
                       "index": round(weighted_median([(r, e) for r, e, _ in v]) - 1, 4),
                       "share_above": round(sum(1 for r, _, _ in v if r > 1) / len(v), 4),
                       "top_in": tops.get(a, 0)})
    states.sort(key=lambda r: (-r["index"], r["state"]))
    gaps = [c["gap"] for c in careers]
    workers = sum(c["employment"] for c in careers)
    dbl = [c for c in careers if c["gap"] >= 1]
    national = {"careers": len(careers), "workers": workers, "median_gap": round(statistics.median(gaps), 4),
                "careers_double": len(dbl), "share_double": round(len(dbl) / len(careers), 4),
                "workers_double": sum(c["employment"] for c in dbl),
                "share_workers_double": round(sum(c["employment"] for c in dbl) / workers, 4),
                "careers_50": sum(1 for g in gaps if g >= 0.5), "share_50": round(sum(1 for g in gaps if g >= 0.5) / len(careers), 4)}
    largest = sorted(careers, key=lambda c: (-c["employment"], c["slug"]))[:12]
    widest = sorted(careers, key=lambda c: (-c["gap"], c["slug"]))[:12]
    narrowest = sorted(careers, key=lambda c: (c["gap"], c["slug"]))[:5]
    out = {"slug": "same-job-different-pay",
           "rules": {"min_employment": MIN_EMP, "max_rse": MAX_RSE, "min_states": MIN_STATES},
           "national": national, "largest": largest, "widest": widest, "narrowest": narrowest, "states": states}
    (OUT / "same-job-different-pay.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    pub = ROOT / "public" / "research"
    pub.mkdir(parents=True, exist_ok=True)
    with open(pub / "same-job-different-pay-careers.csv", "w", newline="") as fh:
        wr = csv.writer(fh)
        wr.writerow(["career", "soc_code", "us_median_pay", "us_employment", "states_with_data", "highest_state",
                     "highest_state_median", "lowest_state", "lowest_state_median", "gap_pct"])
        for c in sorted(careers, key=lambda c: (-c["gap"], c["slug"])):
            wr.writerow([c["title"], occ[c["slug"]]["code"], c["median"], c["employment"], c["states"], c["high"]["state"],
                         c["high"]["median"], c["low"]["state"], c["low"]["median"], round((c["high"]["median"] / c["low"]["median"] - 1) * 100, 1)])
    with open(pub / "same-job-different-pay-states.csv", "w", newline="") as fh:
        wr = csv.writer(fh)
        wr.writerow(["rank", "state", "same_job_pay_index_pct", "careers_compared", "share_paying_above_us_median_pct",
                     "careers_where_state_pays_most"])
        for i, r in enumerate(states, 1):
            wr.writerow([i, r["state"], round(r["index"] * 100, 1), r["careers"], round(r["share_above"] * 100, 1), r["top_in"]])
    print(f"same-job-different-pay: {len(careers)} careers, median gap {national['median_gap']:.1%}, "
          f"{national['share_double']:.1%} double; top {states[0]['state']} {states[0]['index']:+.1%}, "
          f"bottom {states[-1]['state']} {states[-1]['index']:+.1%}")


def main():
    occ, tr, states = load()
    OUT.mkdir(parents=True, exist_ok=True)

    def nat_pay(slug):
        w = own_wage(occ[slug])
        return (w["median"], w["employment"]) if w else None

    national, per_job = area(occ, tr, nat_pay)

    # examples: the 12 largest jobs and their closest qualifying move (national)
    big = sorted(per_job.items(), key=lambda kv: -(kv[1][0][1] or 0))[:12]
    examples = []
    for s, (base, q) in big:
        ex = {"slug": s, "title": occ[s]["title"], "median": base[0], "employment": base[1], "moves": len(q)}
        if q:
            c = q[0]
            ex["to"] = {"slug": c["slug"], "title": c["title"], "match": c["match"], "median": c["median"], "raise": c["raise"]}
        examples.append(ex)

    names = {}
    for d in states.values():
        for a, s in d.items():
            names[a] = s["state"]
    state_rows = []
    for a in sorted(names):
        def st_pay(slug, a=a):
            s = states.get(slug, {}).get(a)
            return (s["median"], s.get("employment")) if s else None
        r, _ = area(occ, tr, st_pay)
        if r["jobs"] < 200:  # too few careers with state pay to compare fairly
            continue
        state_rows.append({"abbr": a, "state": names[a], **r})
    state_rows.sort(key=lambda r: (-r["share_workers"], r["state"]))

    out = {
        "slug": "better-paying-careers",
        "rules": {"raise_min": RAISE_MIN, "top_n": TOP_N, "excludes": "group wages, higher Job Zone, managers and supervisors"},
        "national": national,
        "examples": examples,
        "states": state_rows,
    }
    (OUT / "better-paying-careers.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    n = national
    print(f"better-paying-careers: {n['jobs_with_move']}/{n['jobs']} jobs ({n['share_jobs']:.1%}), "
          f"{n['share_workers']:.1%} of workers, median closest raise {n['median_closest_raise']:.1%}; {len(state_rows)} states")
    same_job_pay(occ)


if __name__ == "__main__":
    main()
