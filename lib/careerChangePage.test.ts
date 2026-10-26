import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { buildFromPage, EXTRA_EDU } from "./careerChangePage";
import { careerChangeSources, singleCodeHubRedirects } from "./data/server";

const hub = JSON.parse(fs.readFileSync("data/processed/hubs/teacher.json", "utf8"));

describe("Jobs for Former page model", () => {
  const m = buildFromPage("teacher")!;
  it("uses every number straight from the hub data", () => {
    expect(m.rows).toHaveLength(hub.top.length);
    m.rows.forEach((r, i) => {
      const t = hub.top[i];
      expect([r.slug, r.match, r.median]).toEqual([t.slug, t.match, t.median]);
      expect(r.payChange).toBe(t.wage_is_group ? null : t.pay_change_pct);
    });
    expect(m.baseline).toBe(hub.baseline_median);
  });
  it("never shows a pay change for a broader BLS group wage", () => {
    for (const r of m.rows) if (r.groupWage) expect(r.payChange).toBeNull();
  });
  it("marks extra education only when the target needs more preparation", () => {
    for (const r of m.rows)
      expect(r.extraEdu).toBe(r.jobZone && r.jobZone > hub.job_zone ? EXTRA_EDU[r.jobZone] : "None");
  });
  it("FAQ numbers match the table", () => {
    const faq = m.faq.map((f) => f.a).join(" ");
    expect(faq).toContain(`${m.rows[0]!.title} (${m.rows[0]!.match}% skill match`);
    const noExtra = m.rows.filter((r) => r.extraEdu === "None").length;
    expect(faq).toContain(`${noExtra} of the ${m.rows.length} matches`);
  });
  it("keeps titles within 60 characters and descriptions within 160", () => {
    for (const s of careerChangeSources().slice(0, 200)) {
      const p = buildFromPage(s)!;
      expect(p.title.length).toBeLessThanOrEqual(60);
      expect(p.description.length).toBeLessThanOrEqual(160);
      expect(p.description.length).toBeGreaterThanOrEqual(70);
    }
  });
  it("folds single-code hubs (no duplicate page for Registered Nurses)", () => {
    expect(singleCodeHubRedirects()).toContainEqual({ from: "registered-nurses", to: "nurse" });
    expect(careerChangeSources()).not.toContain("registered-nurses");
    expect(buildFromPage("not-a-job")).toBeNull();
  });
});
