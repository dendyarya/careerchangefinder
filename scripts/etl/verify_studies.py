"""Recompute data/processed/studies/*.json from the processed files, independently of build_studies.py.

better-paying-careers: re-derives, for the nation and every state, which careers have a qualifying move
(own BLS wage on both sides, Job Zone not higher, no manager/supervisor role, median >= 10% higher, within the
25 closest matches) and compares every published count, share, median and example. same-job-different-pay: rebuilds the per-career gaps and the state index from the wage files and
checks the JSON and the downloadable CSV files. Exits 1 on any problem.
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

# ---- same-job-different-pay: rebuilt from the wage files with its own code
sj = json.loads((P / "studies" / "same-job-different-pay.json").read_text())
R = sj["rules"]
ratios, careers = {}, {}
for slug, d in wf.items():
    o = occ.get(slug)
    if o is None or o["thin"] or not own(slug) or not own(slug).get("median") or own(slug).get("top_coded"):
        continue
    nat = own(slug)["median"]
    good = [x for x in d["states"] if x.get("median") and (x.get("employment") or 0) >= R["min_employment"]
            and x.get("emp_rse") is not None and x["emp_rse"] <= R["max_rse"]]
    for x in good:
        ratios.setdefault(x["abbr"], []).append((x["median"] / nat, x["employment"]))
    if len(good) >= R["min_states"]:
        meds = sorted(x["median"] for x in good)
        careers[slug] = (meds[-1], meds[0], own(slug)["employment"], len(good))
same("same-job careers", sj["national"]["careers"], len(careers))
gaps = {k: v[0] / v[1] - 1 for k, v in careers.items()}
same("same-job median gap", sj["national"]["median_gap"], round(statistics.median(gaps.values()), 4), 0.00005)
same("same-job careers_double", sj["national"]["careers_double"], sum(g >= 1 for g in gaps.values()))
same("same-job careers_50", sj["national"]["careers_50"], sum(g >= 0.5 for g in gaps.values()))
tw = sum(v[2] for v in careers.values())
same("same-job share_workers_double", sj["national"]["share_workers_double"],
     round(sum(careers[k][2] for k, g in gaps.items() if g >= 1) / tw, 4), 0.00005)
for c in sj["largest"] + sj["widest"] + sj["narrowest"]:
    hi, lo, _, n = careers[c["slug"]]
    same(f"same-job {c['slug']} high", c["high"]["median"], hi)
    same(f"same-job {c['slug']} low", c["low"]["median"], lo)
    same(f"same-job {c['slug']} states", c["states"], n)
    same(f"same-job {c['slug']} gap", c["gap"], round(hi / lo - 1, 4), 0.00005)
checked += 1
if [c["slug"] for c in sj["largest"]] != [k for k, _ in sorted(careers.items(), key=lambda kv: (-kv[1][2], kv[0]))[:12]]:
    errors.append("same-job largest list differs")
checked += 1
if [c["slug"] for c in sj["widest"]] != [k for k, _ in sorted(gaps.items(), key=lambda kv: (-kv[1], kv[0]))[:12]]:
    errors.append("same-job widest list differs")
tops = {}
for k, v in careers.items():
    best = max(x["median"] for x in wf[k]["states"] if x["median"] == v[0])
    a = sorted(x["abbr"] for x in wf[k]["states"] if x.get("median") == best and (x.get("employment") or 0) >= R["min_employment"]
               and x.get("emp_rse") is not None and x["emp_rse"] <= R["max_rse"])[-1]
    tops[a] = tops.get(a, 0) + 1
for st in sj["states"]:
    v = sorted(ratios[st["abbr"]])
    half = sum(e for _, e in v) / 2
    acc, wmed = 0, None
    for r, e in v:
        acc += e
        if acc >= half:
            wmed = r
            break
    same(f"same-job {st['abbr']} careers", st["careers"], len(v))
    same(f"same-job {st['abbr']} index", st["index"], round(wmed - 1, 4), 0.00005)
    same(f"same-job {st['abbr']} share_above", st["share_above"], round(sum(r > 1 for r, _ in v) / len(v), 4), 0.00005)
    same(f"same-job {st['abbr']} top_in", st["top_in"], tops.get(st["abbr"], 0))
same("same-job states", len(sj["states"]), len(ratios))
# the downloadable CSV files carry the same numbers
import csv
rows = list(csv.DictReader(open(ROOT / "public" / "research" / "same-job-different-pay-states.csv")))
same("same-job states csv rows", len(rows), len(sj["states"]))
for row, st in zip(rows, sj["states"]):
    same(f"same-job csv {st['abbr']} index", float(row["same_job_pay_index_pct"]), round(st["index"] * 100, 1), 0.001)
rows = list(csv.DictReader(open(ROOT / "public" / "research" / "same-job-different-pay-careers.csv")))
same("same-job careers csv rows", len(rows), len(careers))
by_title = {occ[k]["title"]: g for k, g in gaps.items()}
for row in rows:
    same(f"same-job csv {row['career']} gap", float(row["gap_pct"]), round(by_title[row["career"]] * 100, 1), 0.001)

print(f"{checked:,} study values checked, {len(errors)} problems")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
