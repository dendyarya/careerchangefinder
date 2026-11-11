/**
 * Lead images for News: renders content/news-charts/<slug>.json into public/images/news/<slug>.png
 * (1200×675, our own chart, brand colors and fonts). Run: node scripts/news/render_charts.cjs [slug]
 *
 * Spec: { title, subtitle, source, kind: "hbar", unit: "jobs" | "pct" | "usd" | "millions",
 *         bars: [{ label, value, highlight? }], note? }
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const SPECS = path.join(ROOT, "content", "news-charts");
const OUT = path.join(ROOT, "public", "images", "news");
const font = (f) => fs.readFileSync(path.join(ROOT, "app", "fonts", f)).toString("base64");
const C = { primary: "#1d62af", accent: "#1d91f1", ink: "#0e2a4d", slate: "#394662", muted: "#55627a", ice: "#f5fafd", mist: "#e1ecf4", sky: "#cfe6ff", loss: "#c4242b" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function fmt(v, unit) {
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (unit === "jobs") return `${v < 0 ? "−" : "+"}${a.toLocaleString("en-US")}`;
  if (unit === "pct") return `${v > 0 ? "+" : sign}${a.toFixed(1)}%`;
  if (unit === "usd") return `${sign}$${a.toLocaleString("en-US")}`;
  if (unit === "millions") return `${sign}${a.toFixed(1)} million`;
  return `${sign}${a}`;
}

function html(s) {
  const max = Math.max(...s.bars.map((b) => Math.abs(b.value)));
  const hasNeg = s.bars.some((b) => b.value < 0);
  const rows = s.bars
    .map((b) => {
      const w = (Math.abs(b.value) / max) * (hasNeg ? 48 : 96);
      const left = hasNeg ? (b.value < 0 ? 50 - w : 50) : 0;
      const col = b.value < 0 ? C.loss : b.highlight ? C.primary : C.accent;
      return `<div class="row"><div class="lab">${esc(b.label)}</div><div class="track">${hasNeg ? '<div class="zero"></div>' : ""}<div class="bar" style="left:${left}%;width:${w}%;background:${col}"></div><div class="val" style="left:${b.value < 0 ? 50 : left + w}%;padding-left:10px">${fmt(b.value, s.unit)}</div></div></div>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:SG;src:url(data:font/woff2;base64,${font("space-grotesk-latin-wght-normal.woff2")}) format("woff2");font-weight:300 700}
@font-face{font-family:MR;src:url(data:font/woff2;base64,${font("manrope-latin-wght-normal.woff2")}) format("woff2");font-weight:200 800}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:675px;background:${C.ice};font-family:MR;color:${C.ink};padding:48px 64px 40px;display:flex;flex-direction:column}
.k{font:700 20px SG;color:${C.primary};letter-spacing:.02em;text-transform:uppercase}
h1{font:700 44px/1.08 SG;letter-spacing:-.02em;margin-top:10px;max-width:1050px}
.sub{font:500 22px MR;color:${C.slate};margin-top:10px}
.chart{flex:1;display:flex;flex-direction:column;justify-content:center;gap:${s.bars.length > 6 ? 12 : 18}px;margin-top:22px}
.row{display:grid;grid-template-columns:330px 1fr;align-items:center;gap:20px}
.lab{font:700 ${s.bars.length > 6 ? 20 : 23}px MR;text-align:right;color:${C.ink}}
.track{position:relative;height:${s.bars.length > 6 ? 30 : 40}px;margin-right:150px}
.zero{position:absolute;left:50%;top:-6px;bottom:-6px;width:2px;background:#8fa4bc}
.bar{position:absolute;top:0;height:100%;border-radius:8px}
.val{position:absolute;top:50%;transform:translateY(-50%);font:700 ${s.bars.length > 6 ? 20 : 24}px SG;white-space:nowrap}
.foot{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid ${C.mist};padding-top:14px;font:500 17px MR;color:${C.muted}}
.brand{font:700 20px SG;color:${C.ink}}.brand b{color:${C.primary}}
</style></head><body>
<div class="k">${esc(s.kicker || "News")}</div><h1>${esc(s.title)}</h1>${s.subtitle ? `<div class="sub">${esc(s.subtitle)}</div>` : ""}
<div class="chart">${rows}</div>
<div class="foot"><div>${esc(s.source)}${s.note ? `<br>${esc(s.note)}` : ""}</div><div class="brand">Career Change <b>Finder</b></div></div>
</body></html>`;
}

(async () => {
  const only = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SPECS).filter((f) => f.endsWith(".json") && (!only || f === `${only}.json`));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1 });
  for (const f of files) {
    const spec = JSON.parse(fs.readFileSync(path.join(SPECS, f), "utf8"));
    await page.setContent(html(spec), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(OUT, f.replace(/\.json$/, ".png"));
    await page.screenshot({ path: out, type: "png" });
    console.log("wrote", path.relative(ROOT, out));
  }
  await browser.close();
})();
