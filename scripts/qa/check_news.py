#!/usr/bin/env python3
"""
Checks every news article in content/news before it is published (docs/news-automation.md).
Usage: python3 scripts/qa/check_news.py [--new SLUG]   (--new also applies the rules for a fresh article)

Every article: front matter complete; headline 20-110 characters; summary 70-160; byline set; publishedAt
is UTC "YYYY-MM-DDTHH:MM" and not in the future; lead image exists, is 1200x675 and has a chart spec and alt
text; body 300+ words; ends with a "**Sources:**" line that links at least one primary source (.gov);
internal links point to real routes or content; no banned phrasing; headlines are unique.
--new SLUG: the article was published in the last 6 hours, is not a draft, and no other article from the
last 5 days has the same first Sources link (the same release).
"""
import datetime as dt
import json
import pathlib
import re
import sys

import yaml
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
NEWS = ROOT / "content" / "news"
BANNED = [r"\bbreaking\b", r"\bshocking\b", r"you won't believe", r"\bdiagnos", r"\bguarantee"]
PRIMARY = re.compile(r"https://(www\.)?([a-z0-9-]+\.)*(gov)(/|\))")
errors = []
now = dt.datetime.now(dt.timezone.utc)


def parse(path):
    raw = path.read_text()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if not m:
        errors.append(f"{path.name}: no front matter")
        return None, ""
    return yaml.safe_load(m.group(1)), m.group(2)


def when(v):
    v = str(v)
    if not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d", v):
        return None
    return dt.datetime.fromisoformat(v).replace(tzinfo=dt.timezone.utc)


def route_exists(href):
    p = href.split("#")[0].split("?")[0].rstrip("/")
    if p in ("", "/news", "/research", "/guides", "/careers", "/career-change", "/editorial-policy", "/methodology"):
        return True
    if m := re.fullmatch(r"/news/([a-z0-9-]+)", p):
        return (NEWS / f"{m.group(1)}.mdx").exists()
    if m := re.fullmatch(r"/guides/([a-z0-9-]+)", p):
        return (ROOT / "content" / "guides" / f"{m.group(1)}.mdx").exists()
    if m := re.fullmatch(r"/research/([a-z0-9-]+)", p):
        return (ROOT / "app" / "(site)" / "research" / m.group(1)).exists()
    if m := re.fullmatch(r"/careers/([a-z0-9-]+)(/salary)?", p):
        occ = {o["slug"]: o for o in json.loads((ROOT / "data" / "processed" / "occupations.json").read_text())}
        o = occ.get(m.group(1))
        return bool(o) and not o["thin"]
    if m := re.fullmatch(r"/career-change/from-([a-z0-9-]+)", p):
        occ = {o["slug"]: o for o in json.loads((ROOT / "data" / "processed" / "occupations.json").read_text())}
        return m.group(1) in occ
    return (ROOT / "app" / "(site)" / p.lstrip("/")).exists()


heads, keys = {}, {}
articles = sorted(NEWS.glob("*.mdx"))
for f in articles:
    fm, body = parse(f)
    if fm is None:
        continue
    t = f.stem
    for k in ("title", "description", "author", "publishedAt", "heroImage", "heroImageAlt", "heroImageCaption"):
        if not fm.get(k):
            errors.append(f"{t}: missing {k}")
    title, desc = str(fm.get("title", "")), " ".join(str(fm.get("description", "")).split())
    if not 20 <= len(title) <= 110:
        errors.append(f"{t}: headline {len(title)} characters (20-110)")
    if not 70 <= len(desc) <= 160:
        errors.append(f"{t}: summary {len(desc)} characters (70-160)")
    if title.lower() in heads:
        errors.append(f"{t}: same headline as {heads[title.lower()]}")
    heads[title.lower()] = t
    pub = when(fm.get("publishedAt"))
    if not pub:
        errors.append(f"{t}: publishedAt must be UTC YYYY-MM-DDTHH:MM")
    elif pub > now + dt.timedelta(minutes=5):
        errors.append(f"{t}: publishedAt is in the future")
    if fm.get("updatedAt") and (not when(fm["updatedAt"]) or (pub and when(fm["updatedAt"]) < pub)):
        errors.append(f"{t}: bad updatedAt")
    img = str(fm.get("heroImage", ""))
    ip = ROOT / "public" / img.lstrip("/")
    if not img.startswith("/images/news/") or not ip.exists():
        errors.append(f"{t}: lead image {img} not found")
    else:
        with Image.open(ip) as im:
            if im.size != (1200, 675):
                errors.append(f"{t}: lead image is {im.size}, not 1200x675")
        if not (ROOT / "content" / "news-charts" / f"{ip.stem}.json").exists():
            errors.append(f"{t}: no chart spec content/news-charts/{ip.stem}.json")
    words = len(re.findall(r"[A-Za-z0-9$%][\w$%.,'-]*", re.sub(r"\(([^)]*)\)", " ", body)))
    if words < 300:
        errors.append(f"{t}: body {words} words (300+)")
    src = re.search(r"^\*\*Sources:\*\*(.*)$", body, re.M)
    if not src:
        errors.append(f"{t}: no **Sources:** line")
    elif not PRIMARY.search(src.group(1)):
        errors.append(f"{t}: Sources line has no primary (.gov) link")
    else:
        key = PRIMARY.search(src.group(1)) and re.search(r"\((https://[^)]+)\)", src.group(1)).group(1)
        keys.setdefault(key, []).append((t, pub))
    for b in BANNED:
        if re.search(b, title + " " + desc + " " + body, re.I):
            errors.append(f"{t}: banned phrase /{b}/")
    for href in re.findall(r"\]\((/[^)\s]*)\)", body):
        if not route_exists(href):
            errors.append(f"{t}: internal link {href} does not exist")
    if re.search(r"^#\s", body, re.M):
        errors.append(f"{t}: body has an H1 (the headline is the H1; use ## for sections)")

if "--new" in sys.argv:
    slug = sys.argv[sys.argv.index("--new") + 1]
    f = NEWS / f"{slug}.mdx"
    fm, body = parse(f) if f.exists() else (None, "")
    if not fm:
        errors.append(f"--new {slug}: article not found")
    else:
        pub = when(fm.get("publishedAt"))
        if fm.get("draft") is not False:
            errors.append(f"{slug}: draft must be false")
        if pub and (now - pub).total_seconds() > 6 * 3600:
            errors.append(f"{slug}: publishedAt is more than 6 hours ago; use the current UTC time")
        src = re.search(r"^\*\*Sources:\*\*.*?\((https://[^)]+)\)", body, re.M)
        if src:
            same = [x for x in keys.get(src.group(1), []) if x[0] != slug]
            # releases reuse the same URL each week or month: the same URL in the last 5 days is a duplicate
            if any(p and (now - p).days < 5 for _, p in same):
                errors.append(f"{slug}: {src.group(1)} was already covered by {[x[0] for x in same]}")

print(f"{len(articles)} news articles checked, {len(errors)} problems")
for e in errors:
    print("  -", e)
sys.exit(1 if errors else 0)
