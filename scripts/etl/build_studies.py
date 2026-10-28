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
"""
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


if __name__ == "__main__":
    main()
