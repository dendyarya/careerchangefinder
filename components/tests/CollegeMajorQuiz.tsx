"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ip from "@/data/tests/interest-profiler.json";
import b5 from "@/data/tests/big-five-ipip50.json";
import { money } from "@/lib/format";
import { AREA_TEXT } from "@/lib/riasecText";
import { itemsFor, scoreBigFive, type B5Answer, type B5Answers, type FactorScore } from "@/lib/scoring/bigFive";
import { rankMajors, type MajorProfile } from "@/lib/scoring/collegeMajor";
import { scoreInterestProfiler, type IpAnswer, type IpAnswers } from "@/lib/scoring/interestProfiler";
import { RIASEC, type RiasecScores } from "@/lib/scoring/stats";

const KEY = "ccf-major-quiz-v1";
const B5_IDS = itemsFor(["openness", "conscientiousness"]);
const B5_ITEMS = b5.items.filter((x) => B5_IDS.includes(x.id));
const IP_N = ip.items.length;
const TOTAL = IP_N + B5_ITEMS.length;

type Major = MajorProfile & { top: { slug: string; title: string; median: number | null }[] };
type Saved = { ipA: IpAnswers; bA: B5Answers; i: number };

const trait = (id: "openness" | "conscientiousness", score: number): FactorScore => ({
  id,
  name: id,
  score,
  position: (score - 10) / 40,
  band: score <= 23 ? "low" : score >= 37 ? "high" : "medium",
});

/** Share format #m=RR-II-AA-SS-EE-CC.OO-CC (interest scores, then Openness and Conscientiousness 10-50). */
function decode(h: string) {
  const m = /^#m=(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\.(\d{2})-(\d{2})$/.exec(h);
  if (!m) return null;
  const v = m.slice(1).map(Number);
  if (v.slice(0, 6).some((x) => x > 40) || v.slice(6).some((x) => x < 10 || x > 50)) return null;
  return {
    scores: Object.fromEntries(RIASEC.map((L, k) => [L, v[k]!])) as RiasecScores,
    o: trait("openness", v[6]!),
    c: trait("conscientiousness", v[7]!),
  };
}

export function CollegeMajorQuiz() {
  const [phase, setPhase] = useState<"intro" | "test" | "result">("intro");
  const [ipA, setIpA] = useState<IpAnswers>({});
  const [bA, setBA] = useState<B5Answers>({});
  const [i, setI] = useState(0);
  const [resume, setResume] = useState<Saved | null>(null);
  const [res, setRes] = useState<{ scores: RiasecScores; o: FactorScore; c: FactorScore } | null>(null);
  const [majors, setMajors] = useState<Major[] | null>(null);
  const [copied, setCopied] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const shared = decode(window.location.hash);
      if (shared) {
        setRes(shared);
        setPhase("result");
        return;
      }
      try {
        const v = localStorage.getItem(KEY);
        const s = v ? (JSON.parse(v) as Saved) : null;
        if (s && Object.keys(s.ipA).length) setResume(s);
      } catch {
        /* ignore */
      }
    });
  }, []);
  useEffect(() => {
    if (phase === "result" && !majors)
      fetch("/major-quiz-data.json")
        .then((r) => r.json() as Promise<Major[]>)
        .then(setMajors, () => setMajors([]));
  }, [phase, majors]);
  useEffect(() => {
    headRef.current?.focus();
  }, [i, phase]);

  const ranked = useMemo(
    () =>
      res && majors
        ? (rankMajors(res.scores, res.o, res.c, majors) as (ReturnType<typeof rankMajors>[number] & { cip: string })[])
        : [],
    [res, majors],
  );

  function start(s?: Saved) {
    setIpA(s?.ipA ?? {});
    setBA(s?.bA ?? {});
    setI(s?.i ?? 0);
    setPhase("test");
  }
  function advance(nIp: IpAnswers, nB: B5Answers) {
    if (i < TOTAL - 1) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ipA: nIp, bA: nB, i: i + 1 }));
      } catch {
        /* ignore */
      }
      setTimeout(() => setI(i + 1), 160);
      return;
    }
    const scores = scoreInterestProfiler(nIp).scores;
    const f = scoreBigFive(nB, ["openness", "conscientiousness"]);
    const r = { scores, o: f.openness!, c: f.conscientiousness! };
    setRes(r);
    window.history.replaceState(
      null,
      "",
      `#m=${RIASEC.map((L) => String(scores[L]).padStart(2, "0")).join("-")}.${r.o.score}-${r.c.score}`,
    );
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setPhase("result");
  }

  const btn = (on: boolean) =>
    `min-h-14 rounded-[14px] border-[1.5px] px-3 py-3 text-[16px] font-bold ${on ? "border-primary bg-primary text-white" : "border-field-border bg-white text-ink hover:border-primary"}`;

  if (phase === "intro")
    return (
      <div className="flex max-w-[900px] flex-col gap-5 rounded-lg border-[1.5px] border-mist bg-ice p-6 shadow-md md:p-8">
        <h2
          ref={headRef}
          tabIndex={-1}
          className="m-0 font-display text-[28px] font-bold outline-none focus-visible:shadow-none"
        >
          80 quick questions · about 12 minutes
        </h2>
        <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-slate">
          <li>
            <strong className="text-ink">Your interests:</strong> 60 work activities from the O*NET Interest Profiler.
          </li>
          <li>
            <strong className="text-ink">How you study and work:</strong> 20 statements about curiosity and organization
            (IPIP).
          </li>
        </ol>
        <p className="m-0 text-small text-muted">No sign-up. Your answers stay in your browser.</p>
        <div className="flex flex-wrap gap-3">
          {resume && (
            <button
              type="button"
              onClick={() => start(resume)}
              className="h-[52px] rounded-full bg-primary px-6 text-ui font-extrabold text-white hover:bg-ink"
            >
              Continue ({Object.keys(resume.ipA).length + Object.keys(resume.bA).length}/{TOTAL})
            </button>
          )}
          <button
            type="button"
            onClick={() => start()}
            className={`h-[52px] rounded-full px-6 text-ui font-extrabold ${resume ? "border-[1.5px] border-field-border bg-white" : "bg-primary text-white hover:bg-ink"}`}
          >
            {resume ? "Start over" : "Start the quiz"}
          </button>
        </div>
      </div>
    );

  if (phase === "test") {
    const inIp = i < IP_N;
    const item = inIp ? ip.items[i]! : B5_ITEMS[i - IP_N]!;
    return (
      <div className="flex max-w-[900px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2 text-small font-bold text-muted">
            <span>{inIp ? "Part 1 of 2 · Your interests" : "Part 2 of 2 · How you study and work"}</span>
            <span>
              Question {i + 1} of {TOTAL}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-md bg-mist" aria-hidden="true">
            <div className="h-full bg-accent" style={{ width: `${(i / TOTAL) * 100}%` }} />
          </div>
        </div>
        <section
          aria-labelledby="mq-q"
          className="flex flex-col gap-6 rounded-lg border-[1.5px] border-mist bg-white p-6 shadow-md md:p-8"
        >
          <p className="m-0 text-muted">
            {inIp ? "How would you feel about doing this work activity?" : "How accurately does this describe you?"}
          </p>
          <h2
            id="mq-q"
            ref={headRef}
            tabIndex={-1}
            className="m-0 font-display text-[clamp(28px,4vw,40px)] leading-tight font-bold outline-none focus-visible:shadow-none"
          >
            {item.text}
          </h2>
          <div role="radiogroup" aria-labelledby="mq-q" className="grid gap-2.5 md:grid-cols-5">
            {inIp
              ? ip.scale.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={ipA[item.id] === s.value}
                    onClick={() => {
                      const n = { ...ipA, [item.id]: s.value as IpAnswer };
                      setIpA(n);
                      advance(n, bA);
                    }}
                    className={btn(ipA[item.id] === s.value)}
                  >
                    {s.label}
                  </button>
                ))
              : b5.scale.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={bA[item.id] === s.value}
                    onClick={() => {
                      const n = { ...bA, [item.id]: s.value as B5Answer };
                      setBA(n);
                      advance(ipA, n);
                    }}
                    className={btn(bA[item.id] === s.value)}
                  >
                    {s.label}
                  </button>
                ))}
          </div>
          <button
            type="button"
            disabled={i === 0}
            onClick={() => setI(i - 1)}
            className="h-12 self-start rounded-full px-4 font-extrabold disabled:opacity-40"
          >
            ← Back
          </button>
        </section>
        <p className="m-0 text-small text-muted">
          Part 1 uses the O*NET Interest Profiler Short Form (USDOL/ETA), used unchanged under CC BY-ND 4.0. Part 2 uses
          public-domain IPIP items.
        </p>
      </div>
    );
  }

  const r = res!;
  const code = [...RIASEC].sort((a, b) => r.scores[b] - r.scores[a]).slice(0, 3);
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="mq-result" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-9">
        <p className="m-0 text-small font-bold text-footer-muted">Your results · your answers stay in your browser</p>
        <h2
          id="mq-result"
          ref={headRef}
          tabIndex={-1}
          className="m-0 font-display text-[clamp(28px,3.5vw,40px)] font-bold outline-none focus-visible:shadow-none"
        >
          Interest code {code.join("")}: {code.map((L) => AREA_TEXT[L]!.name).join(" · ")}
        </h2>
        <p className="m-0 text-footer-text">
          Openness {r.o.score}/50 ({r.o.band}) · Conscientiousness {r.c.score}/50 ({r.c.band})
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true))}
            className="h-12 rounded-full bg-white px-5 font-extrabold text-ink"
          >
            {copied ? "Link copied" : "Copy link to my results"}
          </button>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, "", window.location.pathname);
              setCopied(false);
              start();
            }}
            className="h-12 rounded-full border-[1.5px] border-footer-rule px-5 font-extrabold text-white"
          >
            Retake the quiz
          </button>
        </div>
      </section>

      <section aria-labelledby="mq-majors" className="flex flex-col gap-4">
        <h2 id="mq-majors" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
          Your top 15 majors
        </h2>
        <p className="m-0 max-w-[860px] text-slate">
          Each major is scored by how well the careers it leads to match your interests (70%) and your curiosity and
          organization (30%). Majors linked to only a few careers score a little lower.
        </p>
        {!majors ? (
          <p className="m-0 text-muted">Loading majors…</p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {ranked.map((m, k) => {
              const full = majors.find((x) => x.cip === m.cip)!;
              return (
                <li key={m.cip} className="flex flex-col gap-2 rounded-md border-[1.5px] border-mist p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-bold">
                      <span className="mr-2 font-display text-muted">{k + 1}</span>
                      {m.title}
                    </span>
                    <span className="shrink-0 font-display font-semibold">Fit {m.score}</span>
                  </div>
                  {full.top.length > 0 && (
                    <p className="m-0 text-[16px] text-slate">
                      Leads to:{" "}
                      {full.top.map((c, j) => (
                        <span key={c.slug}>
                          {j > 0 && ", "}
                          <Link href={`/careers/${c.slug}`}>{c.title}</Link>
                          {c.median ? ` (${money(c.median)})` : ""}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="m-0 text-small text-muted">
          Majors are linked to careers through the NCES CIP 2020 to SOC 2018 crosswalk. Pay: BLS OEWS May 2025 median. A
          starting point, not advice.
        </p>
      </section>

      <p className="m-0 text-small text-muted">
        This page includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor,
        Employment and Training Administration (USDOL/ETA). Used under the{" "}
        <a href="https://creativecommons.org/licenses/by-nd/4.0/" rel="noopener">
          CC BY-ND 4.0
        </a>{" "}
        license. O*NET® is a trademark of USDOL/ETA.
      </p>
    </div>
  );
}
