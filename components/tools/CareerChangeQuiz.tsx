"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import q from "@/data/tests/career-change-quiz.json";
import { scoreCareerChange, type CcResult } from "@/lib/scoring/careerChange";

export function CareerChangeQuiz() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CcResult | null>(null);
  const [missing, setMissing] = useState(false);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const answered = Object.keys(answers).length;

  function submit() {
    if (answered < q.questions.length) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setResult(scoreCareerChange(answers));
    setTimeout(() => resultRef.current?.focus(), 50);
  }

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {q.questions.map((x, i) => (
          <li key={x.id}>
            <fieldset
              className={`m-0 rounded-lg border-[1.5px] p-5 ${missing && answers[x.id] === undefined ? "border-loss" : "border-mist"}`}
            >
              <legend className="px-1 font-display text-[20px] leading-snug font-bold">
                {i + 1}. {x.text}
              </legend>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {x.options.map((o, k) => {
                  const on = answers[x.id] === k;
                  return (
                    <label
                      key={o.label}
                      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[12px] border-[1.5px] px-4 py-2.5 font-bold ${on ? "border-primary bg-panel" : "border-field-border bg-white hover:border-primary"}`}
                    >
                      <input
                        type="radio"
                        name={x.id}
                        checked={on}
                        onChange={() => setAnswers({ ...answers, [x.id]: k })}
                        className="h-5 w-5 accent-[var(--color-primary)]"
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {missing && (
        <p role="alert" className="m-0 font-bold text-loss">
          Please answer all {q.questions.length} questions ({q.questions.length - answered} left).
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        className="h-[52px] self-start rounded-full bg-primary px-7 text-ui font-extrabold text-white hover:bg-ink"
      >
        See my result
      </button>

      {result && (
        <section aria-labelledby="cc-result" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-8">
          <p className="m-0 text-small font-bold text-footer-muted">
            Your readiness score: {result.points}/{result.max}
          </p>
          <h2
            id="cc-result"
            ref={resultRef}
            tabIndex={-1}
            className="m-0 font-display text-[clamp(30px,4vw,44px)] font-bold outline-none focus-visible:shadow-none"
          >
            {result.level.title}
          </h2>
          <p className="m-0 text-footer-text">{result.level.summary}</p>
          <p className="m-0 font-bold">Next step: {result.level.next_step}</p>
          {result.tips.length > 0 && (
            <div className="rounded-lg bg-white p-5 text-ink">
              <h3 className="m-0 mb-2 text-h3">Your action plan</h3>
              <ol className="m-0 flex list-decimal flex-col gap-2 pl-5">
                {result.tips.map((t) => (
                  <li key={t.area}>{t.tip}</li>
                ))}
              </ol>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/career-change/tool"
              className="rounded-full bg-white px-5 py-3 font-extrabold text-ink no-underline hover:bg-sky hover:text-ink"
            >
              Career Change Tool
            </Link>
            <Link
              href="/transferable-skills"
              className="rounded-full border-[1.5px] border-footer-rule px-5 py-3 font-extrabold text-white no-underline hover:border-white hover:text-white"
            >
              Transferable Skills Finder
            </Link>
          </div>
          <p className="m-0 text-small text-footer-muted">{q.note}</p>
        </section>
      )}
    </div>
  );
}
