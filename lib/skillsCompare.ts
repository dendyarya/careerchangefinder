/** Compare two O*NET transferable-skill profiles (importance 1-5). Pure; unit-tested. */
export type SkillStatus = "carries" | "build" | "less";
export interface SkillRow {
  name: string;
  yours: number;
  target: number;
  status: SkillStatus;
}

/** carries: important in the target (3+) and you already use it at least that much (within 0.25);
 *  build: the target needs it at least 0.25 more than your job; less: everything else. */
export function compareSkills(yours: Record<string, number>, target: Record<string, number>): SkillRow[] {
  const names = Object.keys(target).filter((n) => n in yours);
  const rows = names.map((name) => {
    const y = yours[name]!;
    const t = target[name]!;
    const status: SkillStatus = t - y >= 0.25 ? "build" : t >= 3 ? "carries" : "less";
    return { name, yours: y, target: t, status };
  });
  const order: Record<SkillStatus, number> = { carries: 0, build: 1, less: 2 };
  return rows.sort((a, b) => order[a.status] - order[b.status] || b.target - a.target);
}
