"""Check the sitemaps on a running server (run after `next build`, server started).

Usage: python3 scripts/qa/check_sitemaps.py http://127.0.0.1:3210 [--production]
- index lists every section sitemap; each has at most 50,000 URLs and valid lastmod dates
- every URL answers 200 and is not a redirect
- no thin career profile and no state salary page is listed; old state salary URLs redirect (301) to the
  career's salary page, on that state's row
- with --production: no listed page carries a noindex robots tag
"""
import json
import pathlib
import random
import re
import sys
import urllib.request
import urllib.error

ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / "data" / "processed"
BASE = sys.argv[1].rstrip("/")
PROD = "--production" in sys.argv
SITE = "https://careerchangefinder.com"
errors, checked = [], 0


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


opener = urllib.request.build_opener(NoRedirect)


def get(path):
    try:
        with opener.open(BASE + path, timeout=60) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, ""


code, idx = get("/sitemap.xml")
if code != 200:
    sys.exit(f"sitemap.xml: HTTP {code}")
maps = re.findall(r"<loc>(.*?)</loc>", idx)
occ = {o["slug"]: o for o in json.loads((P / "occupations.json").read_text())}
urls = {}
for m in maps:
    c, body = get(m.replace(SITE, ""))
    if c != 200:
        errors.append(f"{m}: HTTP {c}")
        continue
    locs = re.findall(r"<loc>(.*?)</loc>", body)
    mods = re.findall(r"<lastmod>(.*?)</lastmod>", body)
    if len(locs) > 50000:
        errors.append(f"{m}: {len(locs)} URLs")
    if len(mods) != len(locs) or any(not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d) for d in mods):
        errors.append(f"{m}: bad lastmod")
    for loc in locs:
        if not loc.startswith(SITE + "/") and loc != SITE + "/":
            errors.append(f"{m}: foreign URL {loc}")
        urls[loc.replace(SITE, "") or "/"] = m.rsplit("/", 1)[-1]
dups = len(urls)
state = [u for u in urls if re.fullmatch(r"/careers/[^/]+/salary/[^/]+", u)]
other = [u for u in urls if u not in set(state)]
for u in state:
    errors.append(f"{u}: state salary page in sitemap (these redirect now)")
for old, new in (("/careers/registered-nurses/salary/ohio", "/careers/registered-nurses/salary#ohio"),
                 ("/careers/electricians/salary/new-york", "/careers/electricians/salary#new-york")):
    try:
        opener.open(BASE + old, timeout=60)
        errors.append(f"{old}: no redirect")
    except urllib.error.HTTPError as e:
        checked += 1
        if e.code != 301 or e.headers.get("Location", "").replace(BASE, "") != new:
            errors.append(f"{old}: {e.code} -> {e.headers.get('Location')} (want 301 -> {new})")
for u in other:
    m = re.fullmatch(r"/careers/([^/]+)", u)
    if m and m.group(1) in occ and occ[m.group(1)]["thin"]:
        errors.append(f"{u}: thin profile in sitemap")
random.seed(7)
for u in other:
    c, body = get(u)
    checked += 1
    if c != 200:
        errors.append(f"{u}: HTTP {c}")
    elif PROD and re.search(r'<meta name="robots" content="noindex', body):
        errors.append(f"{u}: noindex page in sitemap")
print(f"{len(maps)} sitemaps, {len(urls):,} URLs; {checked:,} checks, {len(errors)} problems")
for k in sorted(set(urls.values())):
    print(f"  {k:24} {sum(1 for v in urls.values() if v == k):>6,}")
for e in errors[:30]:
    print("  -", e)
sys.exit(1 if errors else 0)
