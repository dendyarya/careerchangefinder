"use client";

import { useState } from "react";

export interface FitQ {
  attr: string;
  text: string;
}

const ANSWERS = [
  { v: 1, label: "Yes" },
  { v: 0, label: "Not sure" },
  { v: -1, label: "No" },
] as const;

/**
 * "Is this career right for me?" Quick check built from the job's O*NET Work Context: each question
 * is about something this job has a lot (or very little) of compared with other jobs.
 */
export function FitCheck({ questions, nameLower }: { questions: FitQ[]; nameLower: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const done = questions.every((q) => answers[q.attr] !== undefined);
  const yes = questions.filter((q) => answers[q.attr] === 1).length;
  const no = questions.filter((q) => answers[q.attr] === -1);
  const verdict = !done
    ? null
    : no.length === 0
      ? "good"
      : no.length <= Math.floor(questions.length / 3)
        ? "mixed"
        : "low";

  return (
    <div className="flex flex-col gap-5">
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {questions.map((q, i) => (
          <li
            key={q.attr}
            className="flex flex-col gap-2.5 rounded-md border-[1.5px] border-mist bg-white p-4 md:flex-row md:items-center md:justify-between"
          >
            <span id={`fit-${q.attr}`} className="font-bold">
              <span className="mr-2 font-display text-muted">{i + 1}.</span>
              {q.text}
            </span>
            <span role="radiogroup" aria-labelledby={`fit-${q.attr}`} className="flex shrink-0 gap-2">
              {ANSWERS.map((a) => {
                const on = answers[q.attr] === a.v;
                return (
                  <button
                    key={a.v}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAnswers({ ...answers, [q.attr]: a.v })}
                    className={`min-h-11 rounded-full border-[1.5px] px-4 text-[16px] font-bold ${on ? "border-primary bg-primary text-white" : "border-field-border bg-white text-ink hover:border-primary"}`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </span>
          </li>
        ))}
      </ol>
      <div aria-live="polite">
        {verdict && (
          <div
            className={`rounded-md p-5 ${verdict === "good" ? "bg-[#E7F5EF]" : verdict === "mixed" ? "bg-ice" : "bg-[#FBEDEE]"}`}
          >
            <p className="m-0 font-display text-[22px] font-bold">
              {verdict === "good"
                ? `Good fit so far: you are fine with ${yes} of ${questions.length} things that stand out in this job.`
                : verdict === "mixed"
                  ? "Mixed fit: most things suit you, but check the ones you said no to."
                  : `Think twice: several everyday parts of work as ${nameLower} may not suit you.`}
            </p>
            {no.length > 0 && (
              <ul className="m-0 mt-2 list-disc pl-5">
                {no.map((q) => (
                  <li key={q.attr}>{q.text.replace(/\?$/, "")}: you said no.</li>
                ))}
              </ul>
            )}
            <p className="m-0 mt-2 text-small text-muted">
              A quick self-check based on O*NET 31.0 work context data, not a test.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
