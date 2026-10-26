import { describe, expect, it } from "vitest";
import b5 from "@/data/tests/big-five-ipip50.json";
import { band, itemsFor, scoreBigFive, type B5Answer, type B5Answers } from "../bigFive";

const answer = (f: (item: (typeof b5.items)[number]) => B5Answer): B5Answers =>
  Object.fromEntries(b5.items.map((i) => [i.id, f(i)]));
const scores = (a: B5Answers) => Object.fromEntries(Object.values(scoreBigFive(a)).map((f) => [f.id, f.score]));

describe("IPIP 50 data", () => {
  it("has 10 items per factor with the official key counts", () => {
    const count = (f: number, k: string) => b5.items.filter((i) => i.factor === f && i.key === k).length;
    expect([count(1, "+"), count(1, "-")]).toEqual([5, 5]);
    expect([count(2, "+"), count(2, "-")]).toEqual([6, 4]);
    expect([count(3, "+"), count(3, "-")]).toEqual([6, 4]);
    expect([count(4, "+"), count(4, "-")]).toEqual([2, 8]);
    expect([count(5, "+"), count(5, "-")]).toEqual([7, 3]);
  });
});

describe("Big Five scoring (5 answer patterns)", () => {
  it("1. all 'Neither': 30 everywhere, medium", () => {
    const r = scoreBigFive(answer(() => 3));
    expect(Object.values(r).map((f) => f.score)).toEqual([30, 30, 30, 30, 30]);
    expect(Object.values(r).every((f) => f.band === "medium")).toBe(true);
  });
  it("2. all 'Very Accurate': +keyed count x5 plus -keyed count x1", () => {
    expect(scores(answer(() => 5))).toEqual({
      extraversion: 30, agreeableness: 34, conscientiousness: 34, "emotional-stability": 18, openness: 38,
    });
  });
  it("3. all 'Very Inaccurate'", () => {
    expect(scores(answer(() => 1))).toEqual({
      extraversion: 30, agreeableness: 26, conscientiousness: 26, "emotional-stability": 42, openness: 22,
    });
  });
  it("4. agree with every +keyed item, disagree with every -keyed item: 50, high", () => {
    const r = scoreBigFive(answer((i) => (i.key === "+" ? 5 : 1)));
    expect(Object.values(r).every((f) => f.score === 50 && f.band === "high" && f.position === 1)).toBe(true);
  });
  it("5. the reverse: 10, low", () => {
    const r = scoreBigFive(answer((i) => (i.key === "+" ? 1 : 5)));
    expect(Object.values(r).every((f) => f.score === 10 && f.band === "low" && f.position === 0)).toBe(true);
  });
  it("band edges", () => {
    expect([band(10), band(23), band(24), band(36), band(37), band(50)]).toEqual(["low", "low", "medium", "medium", "high", "high"]);
  });
  it("scores only two factors with their 20 items (College Major Quiz)", () => {
    const ids = itemsFor(["openness", "conscientiousness"]);
    expect(ids).toHaveLength(20);
    const a = Object.fromEntries(ids.map((id) => [id, 4 as B5Answer]));
    const r = scoreBigFive(a, ["openness", "conscientiousness"]);
    expect(Object.keys(r).sort()).toEqual(["conscientiousness", "openness"]);
    expect(r.openness!.score).toBe(7 * 4 + 3 * 2); // 34
  });
  it("rejects a missing answer", () => {
    const a = answer(() => 3);
    delete a[1];
    expect(() => scoreBigFive(a)).toThrow(/item 1/);
  });
});
