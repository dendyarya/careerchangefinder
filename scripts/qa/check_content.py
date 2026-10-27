"""Check written page content (runbook Tahap 7) against the page data. Run with a staging/local server up.

Usage: python3 scripts/qa/check_content.py http://127.0.0.1:3210
For content/generated/from/<slug>.json:
- shape and length rules from Prompt 7A (intro <= 55 words; why 60-90; 3 tips; 4 FAQ answers of 40-60 words,
  each with at least one number)
- every number in the text appears in the page data (or is a count derived from it)
- banned words (guarantees, hype, IQ/clinical claims, MBTI/NEO)
- overlap with every other page of the same template under 30% (5-word shingles, Jaccard)
Exits 1 on any problem.
"""
import itertools
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = sys.argv[1].rstrip("/")
BANNED = [r"\bguarantee", r"\bultimate\b", r"\brevolutionary\b", r"\bas an ai\b", r"\biq\b", r"\bmbti\b", r"myers-briggs",
          r"\bneo\b", r"\bdiagnos", r"\bwill (earn|make)\b", r"\bdream job\b", r"\bunlock\b", r"\bgame-?changer\b"]
errors, checked = [], 0
words = lambda s: len(re.findall(r"[A-Za-z0-9$%'’.,-]+", s))


def facts(slug):
    with urllib.request.urlopen(f"{BASE}/content-facts/from/{slug}", timeout=60) as r:
        return json.loads(r.read())


def allowed_numbers(f):
    nums = set()
    def add(v):
        if v is None:
            return
        n = abs(int(round(v)))
        nums.add(n)
    add(f["baseline_median"])
    for c in f["careers"]:
        add(c["match"]); add(c["median"]); add(c["pay_change_pct"])
    for s in f["source_skills"]:
        nums.add(s["value"])
    for s in f["similar_in_field"]:
        add(s["match"])
    for u in f.get("up_close", []):  # "Most common education: ... (56% of workers)" is printed on the page
        for line in u["first_step"]:
            for m in re.findall(r"(\d+)% of workers", line):
                nums.add(int(m))
    cs = f["careers"]
    derived = [len(cs), len(f["members"]), len(f["source_skills"]),
               sum(1 for c in cs if (c["pay_change_pct"] or 0) > 0),
               sum(1 for c in cs if c["extra_education"] == "None"),
               sum(1 for c in cs if c["extra_education"] == "Graduate degree"),
               sum(1 for c in cs[:10] if (c["pay_change_pct"] or 0) > 0),
               sum(1 for c in cs[:10] if c["extra_education"] == "None")]
    nums.update(derived)
    nums.update(range(0, 11))  # small counts ("3 steps", "top 10")
    nums.update({31, 2025, 2026, 2018, 2020})  # O*NET 31.0, BLS May 2025, SOC 2018, CIP 2020
    return nums


def numbers_in(text):
    out = []
    for m in re.finditer(r"\$?\d[\d,]*(?:\.\d+)?%?", text):
        tok = m.group(0)
        v = float(tok.replace("$", "").replace(",", "").replace("%", ""))
        out.append((tok, v))
    return out


def shingles(text, k=5):
    w = re.findall(r"[a-z']+", text.lower())
    return {" ".join(w[i:i + k]) for i in range(len(w) - k + 1)}


texts = {}
for f in sorted((ROOT / "content" / "generated" / "from").glob("*.json")):
    slug = f.stem
    c = json.loads(f.read_text())
    fx = facts(slug)
    tag = f"from/{slug}"
    if c.get("status") not in ("draft", "approved"):
        errors.append(f"{tag}: bad status")
    if words(c["intro"]) > 55:
        errors.append(f"{tag}: intro {words(c['intro'])} words (max 55)")
    if not 60 <= words(c["why_it_works"]) <= 90:
        errors.append(f"{tag}: why_it_works {words(c['why_it_works'])} words (60-90)")
    if len(c["tips"]) != 3:
        errors.append(f"{tag}: {len(c['tips'])} tips (3)")
    if len(c["faq"]) != 4:
        errors.append(f"{tag}: {len(c['faq'])} FAQ (4)")
    for qa in c["faq"]:
        n = words(qa["a"])
        if not 40 <= n <= 60:
            errors.append(f"{tag}: FAQ answer {n} words (40-60): {qa['q']}")
        if not numbers_in(qa["a"]):
            errors.append(f"{tag}: FAQ answer without a number: {qa['q']}")
    allowed = allowed_numbers(fx)
    blob = " ".join([c["intro"], c["why_it_works"], *c["tips"], *[q["q"] + " " + q["a"] for q in c["faq"]]])
    for tok, v in numbers_in(blob):
        checked += 1
        if v not in allowed and round(v) not in allowed and v != 31.0:
            errors.append(f"{tag}: number {tok} is not in the page data")
    for b in BANNED:
        if re.search(b, blob, re.I):
            errors.append(f"{tag}: banned phrase /{b}/")
    # names of careers in the text must be careers on the page (or the job itself)
    texts[tag] = blob
for (a, ta), (b, tb) in itertools.combinations(texts.items(), 2):
    sa, sb = shingles(ta), shingles(tb)
    j = len(sa & sb) / max(1, len(sa | sb))
    checked += 1
    if j >= 0.30:
        errors.append(f"{a} and {b}: {j:.0%} overlap (max 30%)")
print(f"{len(texts)} content files, {checked:,} checks, {len(errors)} problems")
for e in errors[:40]:
    print("  -", e)
sys.exit(1 if errors else 0)
