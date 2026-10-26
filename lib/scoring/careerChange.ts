/** Career Change Readiness Quiz (our own questions). Sum of points, 3 levels, tips for weak answers. */
import q from "@/data/tests/career-change-quiz.json";

export type CcAnswers = Record<string, number>; // question id -> option index

export interface CcResult {
  points: number;
  max: number;
  level: { id: string; title: string; summary: string; next_step: string };
  tips: { area: string; tip: string }[];
}

export function scoreCareerChange(answers: CcAnswers): CcResult {
  let points = 0;
  const tips: CcResult["tips"] = [];
  for (const question of q.questions) {
    const idx = answers[question.id];
    if (idx === undefined) throw new Error(`Career Change Quiz: ${question.id} not answered`);
    const opt = question.options[idx];
    if (!opt) throw new Error(`Career Change Quiz: bad option ${idx} for ${question.id}`);
    points += opt.points;
    if (opt.points <= q.scoring.weak_answer_max_points) tips.push({ area: question.area, tip: question.tip });
  }
  const level = q.scoring.levels.find((l) => points >= l.min && points <= l.max);
  if (!level) throw new Error(`Career Change Quiz: no level for ${points}`);
  return { points, max: q.questions.length * 3, level: { id: level.id, title: level.title, summary: level.summary, next_step: level.next_step }, tips };
}
