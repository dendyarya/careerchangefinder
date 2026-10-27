"""Audit every prerendered HTML page in .next/server/app (run after `next build`).

Checks: exactly one <h1>, <title> 30-60 chars (warn) / not empty, meta description 70-160,
canonical present, every JSON-LD block parses, no "undefined"/"NaN"/"[object Object]" in text,
no duplicate titles. Exits 1 on errors.
"""
import collections
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2] / ".next" / "server" / "app"
errors, warns = [], []
titles = collections.defaultdict(list)
n = 0
internal = collections.Counter()
for f in sorted(ROOT.rglob("*.html")):
    rel = "/" + str(f.relative_to(ROOT)).removesuffix(".html").replace("(site)/", "")
    if rel.startswith(("/_", "/keystatic")) or rel.endswith("/index") and rel != "/index" or rel.endswith("/__none"):
        continue  # __none: placeholder param when no guide is published (renders the 404 page)
    rel = "/" if rel == "/index" else rel
    t = f.read_text()
    if "noindex" in t and 'name="robots" content="noindex, follow"' not in t and "/_not-found" in rel:
        continue
    n += 1
    h1 = len(re.findall(r"<h1[\s>]", t))
    if h1 != 1:
        errors.append(f"{rel}: {h1} h1")
    m = re.search(r"<title>(.*?)</title>", t)
    title = html.unescape(m.group(1)) if m else ""
    if not title:
        errors.append(f"{rel}: no title")
    elif not 30 <= len(title) <= 60:
        warns.append(f"{rel}: title {len(title)} chars: {title}")
    titles[title].append(rel)
    d = re.search(r'<meta name="description" content="(.*?)"', t)
    desc = html.unescape(d.group(1)) if d else ""
    if not 70 <= len(desc) <= 160:
        errors.append(f"{rel}: description {len(desc)} chars")
    if '<link rel="canonical"' not in t:
        errors.append(f"{rel}: no canonical")
    types = set()
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        try:
            data = json.loads(block)
        except ValueError as e:
            errors.append(f"{rel}: bad JSON-LD {e}")
            continue
        for node in data.get("@graph", [data]):
            types.add(node.get("@type"))
    # structured data required by the runbook (Tahap 6)
    if not {"Organization", "WebSite"} <= types:
        errors.append(f"{rel}: no Organization/WebSite JSON-LD")
    if rel != "/" and "BreadcrumbList" not in types:
        errors.append(f"{rel}: no BreadcrumbList")
    if re.fullmatch(r"/careers/[^/]+", rel) and "Occupation" not in types and "ItemList" not in types and "CollectionPage" not in types and rel not in ("/careers/a-z", "/careers/industry", "/careers/holland-code"):
        errors.append(f"{rel}: career profile without Occupation JSON-LD")
    if rel.startswith("/guides/") and "Article" not in types:
        errors.append(f"{rel}: guide without Article JSON-LD")
    if re.search(r'<details[^>]*>\s*<summary', t) and "FAQPage" not in types and 'id="faq' in t:
        errors.append(f"{rel}: FAQ section without FAQPage JSON-LD")
    if '<meta property="og:image"' not in t:
        errors.append(f"{rel}: no og:image")
    body = re.sub(r"<script.*?</script>", " ", t, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", body))
    for bad in ("undefined", "NaN", "[object Object]", "null%", "$null"):
        if re.search(rf"(?<![\w-]){re.escape(bad)}(?![\w-])", text):
            errors.append(f"{rel}: text contains {bad}")
    for href in re.findall(r'href="(/[^"#?]*)', body):
        internal[href] += 1
for t, pages in titles.items():
    if len(pages) > 1:
        errors.append(f"duplicate title on {len(pages)} pages: {t} ({pages[:3]})")
built = {"/" + str(f.relative_to(ROOT)).removesuffix(".html").replace("(site)/", "") for f in ROOT.rglob("*.html")}
built = {"/" if b == "/index" else b for b in built}
statics = {"/search-index.json", "/hubs.json", "/big-five-data.json", "/icon.svg", "/apple-icon.png"}
# state salary pages are rendered on demand (ISR): a link is fine if that career has that state in the BLS data
_P = ROOT.parents[2] / "data" / "processed"
_occ = {o["slug"]: o for o in json.loads((_P / "occupations.json").read_text())}
_state_ok = set()
for f in (_P / "wages").glob("*.json"):
    if not _occ[f.stem]["thin"]:
        for st in json.loads(f.read_text())["states"]:
            _state_ok.add(f"/careers/{f.stem}/salary/" + re.sub(r"[^a-z]+", "-", st["state"].lower()))
on_demand = {h for h in internal if re.fullmatch(r"/careers/[^/]+/salary/[^/]+", h)}
for h in sorted(on_demand - _state_ok)[:20]:
    errors.append(f"link to a state salary page with no data: {h}")
missing = sorted(h for h in set(internal) - on_demand if h not in built and h not in statics and not h.startswith(("/_next", "/career-change-data", "/images", "/keystatic")))
print(f"{n} pages audited, {len(errors)} errors, {len(warns)} title-length warnings")
for e in errors[:40]:
    print("  ERROR", e)
for w in warns[:15]:
    print("  warn ", w)
print(f"\n{len(missing)} internal link targets not built yet (future templates):")
print("  " + ", ".join(missing[:60]))
sys.exit(1 if errors else 0)
