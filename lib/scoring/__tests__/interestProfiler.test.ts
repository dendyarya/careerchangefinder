import { describe, expect, it } from "vitest";
import ip from "@/data/tests/interest-profiler.json";
import {
  fitLabel,
  matchCareersByJobZone,
  scoreInterestProfiler,
  type IpAnswer,
  type IpAnswers,
} from "../interestProfiler";
import { pearson } from "../stats";

const answer = (f: (item: (typeof ip.items)[number]) => IpAnswer): IpAnswers =>
  Object.fromEntries(ip.items.map((i) => [i.id, f(i)]));

describe("Interest Profiler data", () => {
  it("has 60 items, 10 per area, official 0-4 scale", () => {
    expect(ip.items).toHaveLength(60);
    for (const L of "RIASEC") expect(ip.items.filter((i) => i.area === L)).toHaveLength(10);
    expect(ip.scale.map((s) => s.label)).toEqual(["Strongly Dislike", "Dislike", "Unsure", "Like", "Strongly Like"]);
  });
  it("starts with the official sequence (two items per area, R-I-A-S-E-C)", () => {
    expect(
      ip.items
        .slice(0, 12)
        .map((i) => i.area)
        .join(""),
    ).toBe("RRIIAASSEECC");
    expect(ip.items[0]!.text).toBe("Build kitchen cabinets");
  });
});

describe("Interest Profiler scoring (5 answer patterns)", () => {
  it("1. Strongly Like everything: 40 in every area, all tied", () => {
    const r = scoreInterestProfiler(answer(() => 4));
    expect(r.scores).toEqual({ R: 40, I: 40, A: 40, S: 40, E: 40, C: 40 });
    expect(r.ties).toEqual([["R", "I", "A", "S", "E", "C"]]);
    expect(r.message).toBeNull();
  });
  it("2. Strongly Dislike everything: zeros and the official retake message", () => {
    const r = scoreInterestProfiler(answer(() => 0));
    expect(r.scores.R).toBe(0);
    expect(r.allStronglyDislike).toBe(true);
    expect(r.message).toContain('You answered "strongly dislike" to all questions.');
  });
  it("3. Only Realistic liked: R = 40, others 0", () => {
    const r = scoreInterestProfiler(answer((i) => (i.area === "R" ? 4 : 0)));
    expect(r.scores).toEqual({ R: 40, I: 0, A: 0, S: 0, E: 0, C: 0 });
    expect(r.ranked[0]).toBe("R");
  });
  it("4. Social 4, Artistic 3, Investigative 2, rest 1", () => {
    const v: Record<string, IpAnswer> = { S: 4, A: 3, I: 2, R: 1, E: 1, C: 1 };
    const r = scoreInterestProfiler(answer((i) => v[i.area]!));
    expect(r.scores).toEqual({ R: 10, I: 20, A: 30, S: 40, E: 10, C: 10 });
    expect(r.ranked).toEqual(["S", "A", "I", "R", "E", "C"]);
    expect(r.ties).toEqual([["R", "E", "C"]]);
  });
  it("5. Odd items Strongly Like, even items Strongly Dislike: 20 everywhere", () => {
    const r = scoreInterestProfiler(answer((i) => (i.id % 2 ? 4 : 0)));
    expect(r.scores).toEqual({ R: 20, I: 20, A: 20, S: 20, E: 20, C: 20 });
  });
  it("rejects missing answers", () => {
    const a = answer(() => 2);
    delete a[60];
    expect(() => scoreInterestProfiler(a)).toThrow(/item 60/);
  });
});

describe("Fit labels (IP Manual ch. 7)", () => {
  it("uses .729 and .608 cutoffs", () => {
    expect(fitLabel(0.729)).toBe("Best Fit");
    expect(fitLabel(0.7289)).toBe("Great Fit");
    expect(fitLabel(0.608)).toBe("Great Fit");
    expect(fitLabel(0.6)).toBe("Good Fit");
    expect(fitLabel(0)).toBe("Good Fit");
    expect(fitLabel(-0.01)).toBeNull();
  });
  it("cutoffs equal one-tailed critical r for N = 6 (t = 2.132 and 1.533, df = 4)", () => {
    const r = (t: number) => t / Math.sqrt(t * t + 4);
    expect(r(2.132)).toBeCloseTo(0.729, 3);
    expect(r(1.533)).toBeCloseTo(0.608, 3);
  });
});

describe("Career linkage", () => {
  const scores = { R: 10, I: 20, A: 30, S: 40, E: 10, C: 10 };
  const careers = [
    { code: "a", title: "Same shape", job_zone: 3, riasec: { R: 1, I: 2, A: 3, S: 4, E: 1, C: 1 } },
    { code: "b", title: "Opposite", job_zone: 3, riasec: { R: 4, I: 3, A: 2, S: 1, E: 4, C: 4 } },
    { code: "c", title: "Other zone", job_zone: 5, riasec: { R: 1, I: 2, A: 3, S: 4, E: 1, C: 1 } },
  ];
  it("puts identical shapes in Best Fit, drops negative r, groups by Job Zone", () => {
    const z = matchCareersByJobZone(scores, careers);
    expect(z[3]!.map((m) => m.code)).toEqual(["a"]);
    expect(z[3]![0]!.fit).toBe("Best Fit");
    expect(z[5]!.map((m) => m.code)).toEqual(["c"]);
  });
  it("pearson matches a hand calculation", () => {
    // x = 1..6, y = 2x -> r = 1 ; y reversed -> r = -1
    expect(pearson([1, 2, 3, 4, 5, 6], [2, 4, 6, 8, 10, 12])).toBeCloseTo(1, 10);
    expect(pearson([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1])).toBeCloseTo(-1, 10);
    expect(pearson([1, 1, 1, 1, 1, 1], [1, 2, 3, 4, 5, 6])).toBeNull();
  });
});
