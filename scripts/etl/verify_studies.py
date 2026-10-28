"""Recompute data/processed/studies/*.json from the processed files, independently of build_studies.py.

better-paying-careers: re-derives, for the nation and every state, which careers have a qualifying move
(own BLS wage on both sides, Job Zone not higher, no manager/supervisor role, median >= 10% higher, within the
25 closest matches) and compares every published count, share, median and example. Exits 1 on any problem.
(The wage files themselves are checked against the BLS files by verify.py.)
"""
import json
import pathlib
import re
import statistics
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / "data" / "processed"
errors, checked = [], 0

occ = {o["slug"]: o for o in json.loads((P / "occupations.json").read_text())}
tr = {f.stem: json.loads(f.read_text()) for f in (P / "transitions").glob("*.json")}
wf = {f.stem: json.loads(f.read_text()) for f in (P / "wages").glob("*.json")}
study = json.loads((P / "studies" / "better-paying-careers.json").read_text())


def own(slug):
    w = occ[slug].get("wage")
    return None if not w or w["is_group"] else w


def pay(slug, abbr):
    if not own(slug):
        return None
    if abbr is None:
        return own(slug)["median"], own(slug)["employment"]
    for s in wf.get(slug, {}).get("states", []):
        if s["abbr"] == abbr and s.get("median"):
            return s["median"], s.get("employment")
    return None


def recompute(abbr):
    jobs = has = workers = workers_has = 0
    raises, first = [], {}
    for s, v in tr.items():
        base = pay(s, abbr)
        if not base:
            continue
        jobs += 1
        workers += base[1] or 0
        hit = None
        for t in v["top"][:25]:
            if re.match(r"11-", t["code"]) or re.search("supervisor", t["title"], re.I):
                continue
            if t["job_zone"] and v["job_zone"] and t["job_zone"] > v["job_zone"]:
                continue
            p = pay(t["slug"], abbr)
            if p and p[0] * 100 >= base[0] * 110:
                hit = hit or (t["slug"], p[0] / base[0] - 1)
                break
        if hit:
            has += 1
            workers_has += base[1] or 0
            raises.append(hit[1])
            first[s] = hit
    return jobs, has, workers, workers_has, raises, first


def same(label, got, want, tol=0.0):
    global checked
    checked += 1
    if got is None or want is None:
        ok = got is want
    else:
        ok = abs(got - want) <= tol
    if not ok:
        errors.append(f"{label}: published {got} vs recomputed {want}")


j, h, w, wh, r, first = recompute(None)
n = study["national"]
same("national jobs", n["jobs"], j)
same("national jobs_with_move", n["jobs_with_move"], h)
same("national share_jobs", n["share_jobs"], round(h / j, 4))
same("national share_workers", n["share_workers"], round(wh / w, 4))
same("national median_closest_raise", n["median_closest_raise"], round(statistics.median(r), 4), 0.00005)
for e in study["examples"]:
    hit = first.get(e["slug"])
    same(f"example {e['slug']} has move", bool(e.get("to")), bool(hit))
    if hit and e.get("to"):
        checked += 1
        if e["to"]["slug"] != hit[0]:
            errors.append(f"example {e['slug']}: closest {e['to']['slug']} vs {hit[0]}")
        same(f"example {e['slug']} raise", e["to"]["raise"], round(hit[1], 4), 0.00005)
for s in study["states"]:
    j, h, w, wh, r, _ = recompute(s["abbr"])
    same(f"{s['abbr']} jobs", s["jobs"], j)
    same(f"{s['abbr']} jobs_with_move", s["jobs_with_move"], h)
    same(f"{s['abbr']} share_workers", s["share_workers"], round(wh / w, 4) if w else None)
    same(f"{s['abbr']} median_closest_raise", s["median_closest_raise"], round(statistics.median(r), 4) if r else None, 0.00005)

print(f"{checked:,} study values checked, {len(errors)} problems")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
