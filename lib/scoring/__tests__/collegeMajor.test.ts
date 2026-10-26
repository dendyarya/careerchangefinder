import { describe, expect, it } from "vitest";
import mp from "@/data/tests/major-profiles.json";
import { rankMajors, scoreMajor, type MajorProfile } from "../collegeMajor";
import type { FactorScore } from "../bigFive";

const trait = (id: "openness" | "conscientiousness", position: number): FactorScore => ({
  id,
  name: id,
  score: 10 + position * 40,
  position,
  band: "medium",
});
const major = (riasec: Record<string, number>, o: number | null, c: number | null): MajorProfile => ({
  cip: "00.0000",
  title: "Test",
  slug: "test",
  careers: Array.from({ length: 99 }, (_, i) => `c${i}`),
  riasec,
  traits: { openness: o, conscientiousness: c },
});
const SHAPE = { R: 1, I: 4, A: 3, S: 2, E: 1, C: 1 };
const PERSON = { R: 10, I: 40, A: 30, S: 20, E: 10, C: 10 };

describe("College Major Quiz (5 answer patterns)", () => {
  it("1. same interest shape and same trait levels: capped at 99", () => {
    expect(
      scoreMajor(PERSON, trait("openness", 0.5), trait("conscientiousness", 0.5), major(SHAPE, 0.5, 0.5)).score,
    ).toBe(99);
  });
  it("2. opposite interests, traits half a range away: 15", () => {
    const opp = { R: 4, I: 1, A: 2, S: 3, E: 4, C: 4 };
    // interest 0 ; traits .15 x .5 x 2 = .15
    expect(scoreMajor(PERSON, trait("openness", 1), trait("conscientiousness", 1), major(opp, 0.5, 0.5)).score).toBe(
      15,
    );
  });
  it("3. no trait data for a major: score uses interests only", () => {
    expect(
      scoreMajor(PERSON, trait("openness", 0), trait("conscientiousness", 0), major(SHAPE, null, null)).score,
    ).toBe(99);
  });
  it("4. flat interest answers give interest fit 0", () => {
    const flat = { R: 20, I: 20, A: 20, S: 20, E: 20, C: 20 };
    expect(
      scoreMajor(flat, trait("openness", 0.5), trait("conscientiousness", 0.5), major(SHAPE, 0.5, 0.5)).interest,
    ).toBe(0);
  });
  it("6. a major linked to 1 career scores half of one linked to many", () => {
    const one = { ...major(SHAPE, 0.5, 0.5), careers: ["x"] };
    expect(scoreMajor(PERSON, trait("openness", 0.5), trait("conscientiousness", 0.5), one).score).toBe(50);
  });
  it("5. real data: an Investigative, open person gets majors whose careers are mostly Investigative", () => {
    const r = rankMajors(
      { R: 10, I: 40, A: 15, S: 10, E: 5, C: 10 },
      trait("openness", 0.9),
      trait("conscientiousness", 0.6),
      mp.majors as MajorProfile[],
    );
    expect(r).toHaveLength(15);
    const top = mp.majors.find((m) => m.cip === r[0]!.cip)!;
    const best = Object.entries(top.riasec).sort((a, b) => b[1] - a[1])[0]![0];
    expect(best).toBe("I");
  });
});
