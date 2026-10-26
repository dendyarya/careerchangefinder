import { describe, expect, it } from "vitest";
import q from "@/data/tests/career-change-quiz.json";
import { scoreCareerChange } from "../careerChange";

// option index equals points (0-3) for every question
const from = (pts: number[]) => Object.fromEntries(q.questions.map((x, i) => [x.id, pts[i]!]));

describe("Career Change Quiz (5 answer patterns)", () => {
  it("option index equals points for every question", () => {
    for (const x of q.questions) expect(x.options.map((o) => o.points)).toEqual([0, 1, 2, 3]);
  });
  it("1. best answers: 30 points, Ready to move, no tips", () => {
    const r = scoreCareerChange(from(Array(10).fill(3)));
    expect([r.points, r.max, r.level.id, r.tips.length]).toEqual([30, 30, "ready", 0]);
  });
  it("2. lowest answers: 0 points, Plan first, 10 tips", () => {
    const r = scoreCareerChange(from(Array(10).fill(0)));
    expect([r.points, r.level.id, r.tips.length]).toEqual([0, "plan-first", 10]);
  });
  it("3. 13 points is still Plan first", () => {
    const r = scoreCareerChange(from([3, 3, 3, 3, 1, 0, 0, 0, 0, 0]));
    expect([r.points, r.level.id]).toEqual([13, "plan-first"]);
    expect(r.tips.map((t) => t.area)).toEqual(["target", "research", "skills", "training", "benefits", "materials"]);
  });
  it("4. 14 and 22 points are Getting ready", () => {
    expect(scoreCareerChange(from([3, 3, 3, 3, 2, 0, 0, 0, 0, 0])).level.id).toBe("getting-ready");
    expect(scoreCareerChange(from([3, 3, 3, 3, 3, 3, 2, 2, 0, 0])).level.id).toBe("getting-ready");
  });
  it("5. 23 points is Ready to move, a 1-point answer still adds its tip", () => {
    const r = scoreCareerChange(from([3, 3, 3, 3, 3, 3, 3, 1, 1, 0]));
    expect([r.points, r.level.id]).toEqual([23, "ready"]);
    expect(r.tips.map((t) => t.area)).toEqual(["training", "benefits", "materials"]);
  });
  it("levels cover 0-30 with no gaps", () => {
    const covered = new Set<number>();
    for (const l of q.scoring.levels) for (let p = l.min; p <= l.max; p++) covered.add(p);
    expect(covered.size).toBe(31);
  });
});
