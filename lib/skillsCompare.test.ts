import { describe, expect, it } from "vitest";
import skills from "@/data/processed/skills.json";
import { compareSkills } from "./skillsCompare";

describe("compareSkills", () => {
  it("labels carries, build and less", () => {
    const r = compareSkills({ A: 4, B: 2, C: 2 }, { A: 3.9, B: 3.5, C: 2.1 });
    expect(r.map((x) => [x.name, x.status])).toEqual([
      ["A", "carries"],
      ["B", "build"],
      ["C", "less"],
    ]);
  });
  it("a gap of exactly 0.25 counts as build (same rule as skill gaps on career-change pages)", () => {
    expect(compareSkills({ A: 3 }, { A: 3.25 })[0]!.status).toBe("build");
  });
  it("works on real data: teachers to training specialists", () => {
    const s = skills as Record<string, Record<string, number>>;
    const r = compareSkills(s["elementary-school-teachers"]!, s["training-and-development-specialists"]!);
    expect(r.length).toBeGreaterThan(20);
    expect(r.find((x) => x.name === "Instructing")!.status).toBe("carries");
  });
});
