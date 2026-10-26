import { describe, expect, it } from "vitest";
import cm from "@/data/tests/career-match.json";
import attrs from "@/data/tests/career-attributes.json";
import { careerMatchScore, rankCareers, readAnswers, type CareerAttrs, type CmAnswers } from "../careerMatch";

const DONT = (q: (typeof cm.questions)[number]) => q.options.findIndex((o) => "target" in o && o.target === null);
const allDont = (): CmAnswers =>
  Object.fromEntries(cm.questions.map((q) => [q.id, "filter" in q ? 3 : DONT(q)]));

const career = (code: string, jz: number, a: Record<string, number | null>): CareerAttrs => ({
  code, slug: code, title: code, job_zone: jz, median: 50000,
  riasec: { R: 1, I: 2, A: 3, S: 4, E: 1, C: 1 }, attrs: a,
});
const S_HIGH = { R: 10, I: 20, A: 30, S: 40, E: 10, C: 10 };

describe("Career Match (5 answer patterns)", () => {
  it("1. everything 'Doesn't matter': no preferences, ranking by interest only", () => {
    const p = readAnswers(allDont());
    expect(p.prefs).toEqual([]);
    expect(p.maxJobZone).toBe(5);
    expect(careerMatchScore(p, career("x", 3, { contact: 0.9 }))).toBeNull();
    const r = rankCareers(S_HIGH, p, [career("x", 3, {})]);
    expect(r[0]!.score).toBe(99); // r = 1 -> 100, capped at 99
  });
  it("2. 'A lot' of contact: exact fit = 100, far fit = 30", () => {
    const p = readAnswers({ ...allDont(), cm1: 2 });
    expect(careerMatchScore(p, career("x", 3, { contact: 0.85 }))).toBeCloseTo(100, 6);
    expect(careerMatchScore(p, career("y", 3, { contact: 0.15 }))).toBeCloseTo(30, 6);
  });
  it("3. 'Little or no' training hides careers above Job Zone 2", () => {
    const p = readAnswers({ ...allDont(), cm12: 0 });
    expect(p.maxJobZone).toBe(2);
    const r = rankCareers(S_HIGH, p, [career("low", 2, {}), career("high", 4, {})]);
    expect(r.map((x) => x.code)).toEqual(["low"]);
  });
  it("4. 'Pay very important' weighs 1.5 against contact weight 1", () => {
    const p = readAnswers({ ...allDont(), cm1: 2, cm13: 0 });
    // contact fit 1 - |.85 - .35| = .5 ; pay fit 1 - |.9 - .9| = 1 -> (.5 + 1.5) / 2.5 = .8
    expect(careerMatchScore(p, career("x", 3, { contact: 0.35, pay: 0.9 }))).toBeCloseTo(80, 6);
  });
  it("5. missing O*NET data for an attribute is skipped, not counted as a mismatch", () => {
    const p = readAnswers({ ...allDont(), cm1: 2, cm6: 0 });
    expect(careerMatchScore(p, career("x", 3, { contact: 0.85, regular_schedule: null }))).toBeCloseTo(100, 6);
  });
  it("combined score = 60% interest + 40% Career Match", () => {
    const p = readAnswers({ ...allDont(), cm1: 0 });
    const r = rankCareers(S_HIGH, p, [career("x", 3, { contact: 0.85 })]);
    // interest 100, match 1 - |.15 - .85| = 30 -> 60 + 12 = 72
    expect(r[0]!.score).toBe(72);
  });
  it("real data: a strongly Social person who wants contact gets Social careers first", () => {
    const p = readAnswers({ ...allDont(), cm1: 2, cm2: 2 });
    const r = rankCareers({ R: 5, I: 10, A: 10, S: 40, E: 15, C: 5 }, p, attrs.careers as CareerAttrs[], 10);
    expect(r).toHaveLength(10);
    const top = attrs.careers.find((c) => c.code === r[0]!.code)!;
    const best = Object.entries(top.riasec).sort((a, b) => b[1] - a[1])[0]![0];
    expect(best).toBe("S");
  });
  it("rejects an unanswered question", () => {
    const a = allDont();
    delete a.cm5;
    expect(() => readAnswers(a)).toThrow(/cm5/);
  });
});

describe("Approved question fixes (Gate 3B)", () => {
  it("cm7 'Fine with me' adds no preference for long hours", () => {
    const p = readAnswers({ ...allDont(), cm7: 2 });
    expect(p.prefs.find((x) => x.attr === "long_hours")).toBeUndefined();
  });
  it("cm9 third option asks for risk, not just accepts it", () => {
    const q9 = cm.questions.find((q) => q.id === "cm9")!;
    expect(q9.options[2]!.label).toBe("I'd like hands-on work with some risk");
  });
});
