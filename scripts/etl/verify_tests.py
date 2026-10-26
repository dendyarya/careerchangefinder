"""Check test items and rules in data/tests against the saved official source files.

- Interest Profiler: all 60 item texts appear word for word in the official PDF, 10 per area,
  area matches the PDF section, official 0-4 scale, fit cutoffs .729/.608.
- IPIP 50: every item text, factor and key matches the official page; reverse-key rule.
Exits 1 on any problem.
"""
import html
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "tests"
T = ROOT / "data" / "tests"
errors = []


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


# ---------------- Interest Profiler
ip = json.loads((T / "interest-profiler.json").read_text())
pdf = subprocess.run(["pdftotext", "-layout", str(RAW / "Interest_Profiler.pdf"), "-"], capture_output=True, text=True, check=True).stdout
# split the PDF into its six shaded sections (each ends with "<Area> checks =")
sections, cur = {}, []
for line in pdf.splitlines():
    m = re.search(r"(Realistic|Investigative|Artistic|Social|Enterprising|Conventional) checks =", line)
    cur.append(line)
    if m:
        sections[m.group(1)[0]] = norm(" ".join(cur))
        cur = []
if len(sections) != 6:
    errors.append(f"PDF sections found: {len(sections)}")
if len(ip["items"]) != 60:
    errors.append("Interest Profiler must have 60 items")
for it in ip["items"]:
    if it["text"] not in sections.get(it["area"], ""):
        errors.append(f"IP item {it['id']} not found word for word in PDF section {it['area']}: {it['text']}")
for L in "RIASEC":
    n = sum(1 for i in ip["items"] if i["area"] == L)
    if n != 10:
        errors.append(f"IP area {L} has {n} items")
if [s["value"] for s in ip["scale"]] != [0, 1, 2, 3, 4]:
    errors.append("IP scale must be 0-4")
cut = {f["label"]: f["min_r"] for f in ip["scoring"]["occupation_link"]["fit"]}
if cut != {"Best Fit": 0.729, "Great Fit": 0.608, "Good Fit": 0.0}:
    errors.append(f"IP fit cutoffs changed: {cut}")
print(f"Interest Profiler: {len(ip['items'])} items checked against the official PDF")

# ---------------- IPIP 50
b5 = json.loads((T / "big-five-ipip50.json").read_text())
page = (RAW / "ipip-50-item-scale.htm").read_text()
page_text = norm(re.sub(r"<[^>]+>", " ", page).replace("&#39;", "'").replace("&nbsp;", " "))
official = re.findall(r"(\d+)\. (.+?)(?: О)+ \((\d)([+-])\)", page_text)
official = {int(n): (norm(t.split(" 1. ")[-1]) if n == "1" else norm(t), int(f), k) for n, t, f, k in official}
if len(official) != 50:
    errors.append(f"IPIP page parse found {len(official)} items")
for it in b5["items"]:
    o = official.get(it["id"])
    if not o:
        errors.append(f"IPIP item {it['id']} missing on page")
        continue
    if (it["text"], it["factor"], it["key"]) != o:
        errors.append(f"IPIP item {it['id']} {(it['text'], it['factor'], it['key'])} != official {o}")
rules = (RAW / "ipip-scoring-instructions.htm").read_text()
if '"Very Inaccurate" is assigned a value of 5' not in norm(html.unescape(re.sub(r"<[^>]+>", " ", rules))):
    errors.append("IPIP reverse-key rule not found in saved scoring instructions")
print(f"IPIP: {len(b5['items'])} items checked against the official page")

# ---------------- own tests: structure
cc = json.loads((T / "career-change-quiz.json").read_text())
covered = {p for lv in cc["scoring"]["levels"] for p in range(lv["min"], lv["max"] + 1)}
if covered != set(range(0, 3 * len(cc["questions"]) + 1)):
    errors.append("Career Change levels do not cover the full point range")
cm = json.loads((T / "career-match.json").read_text())
attrs = json.loads((T / "career-attributes.json").read_text())
known = set(attrs["careers"][0]["attrs"]) | {"job_zone"}
for q in cm["questions"]:
    if q["attr"] not in known:
        errors.append(f"Career Match {q['id']} uses unknown attribute {q['attr']}")
print(f"Career Match: {len(cm['questions'])} questions, Career Change: {len(cc['questions'])} questions")

print(f"\n{len(errors)} problems")
for e in errors:
    print("  -", e)
sys.exit(1 if errors else 0)
