"""Write docs/data-report.md from data/processed. Run after build.py."""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / "data" / "processed"


def money(v):
    return "—" if v is None else f"${v:,}"


def pct(v):
    return "—" if v is None else (f"+{v}%" if v > 0 else f"{v}%".replace("-", "−"))


def main():
    meta = json.loads((P / "meta.json").read_text())
    occ = json.loads((P / "occupations.json").read_text())
    thin = [o for o in occ if o["thin"]]
    lines = ["# Data report", "", f"Built: {meta['built_at']}", "",
             "Sources: " + ", ".join(meta["sources"].values()), "", "## Counts", "",
             "| Item | Count |", "|---|---|"]
    for k, v in meta["counts"].items():
        lines.append(f"| {k} | {v:,} |")
    lines += ["", "## Score settings", "", "```json", json.dumps({k: meta[k] for k in ("weights", "job_zone_up_penalty", "job_zone_down_penalty")}, indent=2), "```", ""]

    lines += ["## Sample transitions (top 10 per hub)", "",
              "Match = our estimate (0–99). Pay change vs. the source job's median. "
              "\"Group\" = pay is for a broader BLS group.", ""]
    for hub in ["teacher", "nurse", "accountant", "retail-worker", "police-officer"]:
        d = json.loads((P / "hubs" / f"{hub}.json").read_text())
        lines += [f"### Former {d['plural']} (baseline median {money(d['baseline_median'])})", "",
                  "| # | Career | Match | Median pay | Pay change | Education | Note |", "|---|---|---|---|---|---|---|"]
        for i, t in enumerate(d["top"][:10], 1):
            note = f"Group: {t['wage_source_title']}" if t["wage_is_group"] else ""
            lines.append(f"| {i} | {t['title']} | {t['match']} | {money(t['median'])} | {pct(t['pay_change_pct'])} | {t['education_label']} | {note} |")
        lines += ["", "Similar roles in the same field: " + ", ".join(f"{x['title']} ({x['match']})" for x in d["similar_in_field"][:5]), ""]

    lines += ["## Thin occupations (noindex, not in sitemap)", "",
              f"{len(thin)} of {len(occ)} occupations lack BLS pay, full O*NET profiles, or are \"All Other\" groups.", ""]
    for o in thin:
        reason = []
        if not o["wage"] or o["wage"]["median"] is None:
            reason.append("no BLS median")
        if "All Other" in o["title"]:
            reason.append("All Other")
        if not reason:
            reason.append("incomplete O*NET profile")
        lines.append(f"- {o['code']} {o['title']} — {', '.join(reason)}")
    (ROOT / "docs" / "data-report.md").write_text("\n".join(lines) + "\n")
    print("wrote docs/data-report.md")


if __name__ == "__main__":
    main()
