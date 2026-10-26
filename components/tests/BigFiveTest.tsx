"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import b5 from "@/data/tests/big-five-ipip50.json";
import { scoreBigFive, type B5Answer, type B5Answers, type FactorScore } from "@/lib/scoring/bigFive";
import { money } from "@/lib/format";
import { TRAITS } from "@/lib/traits";

const KEY = "ccf-big-five-v1";
const ITEMS = b5.items;
const SCALE = b5.scale;

type CareerMini = { slug: string; title: string; median: number | null };

function save(a: B5Answers, i: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ a, i }));
  } catch {
    /* private mode: progress is just not remembered */
  }
}
function load(): { a: B5Answers; i: number } | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as { a: B5Answers; i: number }) : null;
  } catch {
    return null;
  }
}

/** Results can be shared as #s=30-34-34-18-38 (E-A-C-ES-O). The hash never reaches our server. */
function scoresFromHash(): Record<string, FactorScore> | null {
  const m = /#s=(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(window.location.hash);
  if (!m) return null;
  const vals = m.slice(1, 6).map(Number);
  if (vals.some((v) => v < 10 || v > 50)) return null;
  const out: Record<string, FactorScore> = {};
  TRAITS.forEach((t, i) => {
    const score = vals[i]!;
    out[t.id] = {
      id: t.id,
      name: t.name,
      score,
      position: (score - 10) / 40,
      band: score <= 23 ? "low" : score >= 37 ? "high" : "medium",
    };
  });
  return out;
}

export function BigFiveTest() {
  const [phase, setPhase] = useState<"intro" | "test" | "result">("intro");
  const [answers, setAnswers] = useState<B5Answers>({});
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Record<string, FactorScore> | null>(null);
  const [careers, setCareers] = useState<Record<string, CareerMini[]> | null>(null);
  const [resume, setResume] = useState<{ a: B5Answers; i: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // read saved progress / shared result after mount (browser-only APIs); state is set in a microtask
  useEffect(() => {
    void Promise.resolve().then(() => {
      const shared = scoresFromHash();
      if (shared) {
        setResult(shared);
        setPhase("result");
        return;
      }
      const saved = load();
      if (saved && Object.keys(saved.a).length > 0) setResume(saved);
    });
  }, []);

  useEffect(() => {
    if (phase === "result" && !careers)
      fetch("/big-five-data.json")
        .then((r) => r.json() as Promise<Record<string, CareerMini[]>>)
        .then(setCareers, () => setCareers({}));
  }, [phase, careers]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [i, phase]);

  function start(from?: { a: B5Answers; i: number }) {
    setAnswers(from?.a ?? {});
    setI(from?.i ?? 0);
    setPhase("test");
  }

  function pick(v: B5Answer) {
    const item = ITEMS[i]!;
    const next = { ...answers, [item.id]: v };
    setAnswers(next);
    if (i < ITEMS.length - 1) {
      save(next, i + 1);
      setTimeout(() => setI(i + 1), 180);
    } else {
      finish(next);
    }
  }

  function finish(a: B5Answers) {
    const r = scoreBigFive(a);
    setResult(r);
    setPhase("result");
    const hash = `#s=${TRAITS.map((t) => String(r[t.id]!.score).padStart(2, "0")).join("-")}`;
    window.history.replaceState(null, "", hash);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  if (phase === "intro") {
    return (
      <div className="flex max-w-[900px] flex-col gap-5 rounded-lg border-[1.5px] border-mist bg-ice p-6 shadow-md md:p-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="m-0 font-display text-[28px] font-bold outline-none focus-visible:shadow-none focus-visible:outline-none"
        >
          50 statements · about 8 minutes
        </h2>
        <p className="m-0 text-slate">{b5.instructions}</p>
        <p className="m-0 text-small text-muted">
          No sign-up. Your answers stay in your browser and are never sent to us. Not a clinical or hiring test.
        </p>
        <div className="flex flex-wrap gap-3">
          {resume ? (
            <>
              <button
                type="button"
                onClick={() => start(resume)}
                className="h-[52px] rounded-full bg-primary px-6 text-ui font-extrabold text-white hover:bg-ink"
              >
                Continue where I left off ({Object.keys(resume.a).length}/50)
              </button>
              <button
                type="button"
                onClick={() => start()}
                className="h-[52px] rounded-full border-[1.5px] border-field-border bg-white px-6 text-ui font-extrabold text-ink"
              >
                Start over
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => start()}
              className="h-[52px] rounded-full bg-primary px-6 text-ui font-extrabold text-white hover:bg-ink"
            >
              Start the test
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "test") {
    const item = ITEMS[i]!;
    const chosen = answers[item.id];
    const pct = Math.round((i / ITEMS.length) * 100);
    return (
      <div className="flex max-w-[900px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-small font-bold text-muted">
            <span>Big Five Personality Test</span>
            <span>
              Statement {i + 1} of {ITEMS.length}
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-md bg-mist"
            role="progressbar"
            aria-label="Progress"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-md bg-accent transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <section
          aria-labelledby="b5-q"
          className="flex flex-col gap-6 rounded-lg border-[1.5px] border-mist bg-white p-6 shadow-md md:p-8"
        >
          <p className="m-0 text-muted">How accurately does this describe you?</p>
          <h2
            id="b5-q"
            ref={headingRef}
            tabIndex={-1}
            className="m-0 font-display text-[clamp(28px,4vw,40px)] leading-tight font-bold outline-none focus-visible:shadow-none focus-visible:outline-none"
          >
            {item.text}
          </h2>
          <div role="radiogroup" aria-labelledby="b5-q" className="grid gap-2.5 md:grid-cols-5">
            {SCALE.map((s) => {
              const on = chosen === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(s.value as B5Answer)}
                  onKeyDown={(e) => {
                    if (["1", "2", "3", "4", "5"].includes(e.key)) pick(Number(e.key) as B5Answer);
                  }}
                  className={`min-h-14 rounded-[14px] border-[1.5px] px-3 py-3 text-[16px] font-bold ${on ? "border-primary bg-primary text-white" : "border-field-border bg-white text-ink hover:border-primary"}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => setI(i - 1)}
              className="h-12 rounded-full px-4 font-extrabold text-ink disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={chosen === undefined}
              onClick={() => (i < ITEMS.length - 1 ? setI(i + 1) : finish(answers))}
              className="h-12 rounded-full px-4 font-extrabold text-primary disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </section>
        <p className="m-0 text-small text-muted">Tip: press 1–5 to answer. Your progress is saved in this browser.</p>
      </div>
    );
  }

  // results
  const r = result!;
  // Lead with the highest score (a strength). Only if every score is below the middle, use the most extreme one.
  const byScore = [...TRAITS].sort((a, b) => r[b.id]!.score - r[a.id]!.score);
  const strongest =
    r[byScore[0]!.id]!.position >= 0.5
      ? byScore[0]!
      : [...TRAITS].sort((a, b) => Math.abs(r[b.id]!.position - 0.5) - Math.abs(r[a.id]!.position - 0.5))[0]!;
  const sEnd = r[strongest.id]!.position >= 0.5 ? "high" : "low";
  const list = careers?.[`${sEnd}-${strongest.id}`] ?? [];
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="b5-result" className="flex flex-col gap-5 rounded-xl bg-ink p-6 text-white md:p-9">
        <p className="m-0 text-small font-bold text-footer-muted">Your results · your answers stay in your browser</p>
        <h2
          id="b5-result"
          ref={headingRef}
          tabIndex={-1}
          className="m-0 font-display text-[clamp(30px,4vw,44px)] leading-tight font-bold outline-none focus-visible:shadow-none focus-visible:outline-none"
        >
          Your highest trait: {sEnd === "high" ? strongest.high.label : strongest.low.label}
        </h2>
        <p className="m-0 max-w-[760px] text-footer-text">
          {sEnd === "high" ? strongest.high.short : strongest.low.short}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
            }}
            className="h-12 rounded-full bg-white px-5 font-extrabold text-ink"
          >
            {copied ? "Link copied" : "Copy link to my results"}
          </button>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, "", window.location.pathname);
              setResult(null);
              setCopied(false);
              start();
            }}
            className="h-12 rounded-full border-[1.5px] border-footer-rule px-5 font-extrabold text-white"
          >
            Retake the test
          </button>
        </div>
      </section>

      <section aria-label="Your five scores" className="flex flex-col gap-5">
        {TRAITS.map((t) => {
          const f = r[t.id]!;
          const end = f.band === "low" ? "low" : "high";
          return (
            <div key={t.id} className="flex flex-col gap-2 rounded-lg border-[1.5px] border-mist p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="m-0 text-h3">{t.name}</h3>
                <span className="font-display font-bold tabular">
                  {f.score}/50 · <span className="capitalize">{f.band}</span>
                </span>
              </div>
              <div className="relative h-3 rounded-[7px] bg-mist" aria-hidden="true">
                <div
                  className="h-full rounded-[7px] bg-primary"
                  style={{ width: `${Math.max(3, f.position * 100)}%` }}
                />
              </div>
              <p className="m-0 text-[17px] text-slate">{t.about}</p>
              <Link
                href={f.band === "medium" ? `/tests/results/big-five#${t.id}` : `/tests/results/${end}-${t.id}`}
                className="font-extrabold"
              >
                What{" "}
                {f.band === "medium"
                  ? `a middle ${t.name.replace(/ \(.*\)/, "")} score means`
                  : `${end} ${t.name.replace(/ \(.*\)/, "")} means`}{" "}
                →
              </Link>
            </div>
          );
        })}
        <p className="m-0 text-small text-muted">
          Scores are sums of 10 statements each (10–50). Low / medium / high are equal thirds of that range, not
          comparisons with other people.
        </p>
      </section>

      {list.length > 0 && (
        <section aria-labelledby="b5-careers" className="flex flex-col gap-4">
          <h2 id="b5-careers" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
            Careers that fit your highest trait
          </h2>
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {list.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/careers/${c.slug}`}
                  className="flex justify-between gap-3 rounded-md border-[1.5px] border-mist px-4 py-3.5 font-bold text-ink no-underline hover:border-primary"
                >
                  <span>{c.title}</span>
                  <span className="shrink-0 font-display text-muted tabular">{money(c.median)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="m-0 text-small text-muted">
            Based on O*NET 31.0 Work Styles. Pay: BLS OEWS May 2025 national median. A starting point, not career
            advice.
          </p>
        </section>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        <Link
          href="/career-test"
          className="flex flex-col gap-2 rounded-lg bg-primary p-6 text-white no-underline hover:bg-ink hover:text-white"
        >
          <span className="font-display text-[22px] font-bold">Add your interests</span>
          <span>The Free Career Test turns your interests into careers you can move into.</span>
          <span className="font-extrabold">Take the Free Career Test →</span>
        </Link>
        <Link
          href="/college-major-quiz"
          className="flex flex-col gap-2 rounded-lg border-[1.5px] border-mist p-6 text-ink no-underline hover:border-primary hover:text-ink"
        >
          <span className="font-display text-[22px] font-bold">Thinking about college?</span>
          <span className="text-muted">See which majors fit your interests and personality.</span>
          <span className="font-extrabold text-primary">Take the College Major Quiz →</span>
        </Link>
      </section>
    </div>
  );
}
