"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ip from "@/data/tests/interest-profiler.json";
import cm from "@/data/tests/career-match.json";
import { JobPicker } from "@/components/career-change/JobPicker";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { AREA_TEXT } from "@/lib/riasecText";
import { rankCareers, readAnswers, type CareerAttrs, type CmAnswers } from "@/lib/scoring/careerMatch";
import {
  matchCareersByJobZone,
  scoreInterestProfiler,
  type IpAnswer,
  type IpAnswers,
  type IpResult,
} from "@/lib/scoring/interestProfiler";
import { RIASEC, type RiasecScores } from "@/lib/scoring/stats";

const KEY = "ccf-career-test-v1";
const IP_N = ip.items.length; // 60
const CM_N = cm.questions.length; // 13
const TOTAL = IP_N + CM_N;
const JZ_LABEL: Record<number, string> = {
  1: "Little or no preparation",
  2: "Some preparation",
  3: "Medium preparation",
  4: "Considerable preparation",
  5: "Extensive preparation",
};

type Saved = { ipA: IpAnswers; cmA: CmAnswers; i: number };
type ToolData = {
  pageSlug: string;
  name: string;
  rows: { slug: string; title: string; match: number; median: number | null; payChange: number | null }[];
};

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* not remembered in private mode */
  }
}
function load(): Saved | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as Saved) : null;
  } catch {
    return null;
  }
}

/** Share format: #t=RR-II-AA-SS-EE-CC.<13 option digits>. The hash never reaches our server. */
function encode(scores: RiasecScores, cmA: CmAnswers) {
  return `#t=${RIASEC.map((L) => String(scores[L]).padStart(2, "0")).join("-")}.${cm.questions.map((q) => cmA[q.id]).join("")}`;
}
function decode(hash: string): { scores: RiasecScores; cmA: CmAnswers } | null {
  const m = /^#t=(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\.(\d{13})$/.exec(hash);
  if (!m) return null;
  const vals = m.slice(1, 7).map(Number);
  if (vals.some((v) => v > 40)) return null;
  const scores = Object.fromEntries(RIASEC.map((L, k) => [L, vals[k]!])) as RiasecScores;
  const digits = m[7]!.split("").map(Number);
  const cmA: CmAnswers = {};
  for (const [k, q] of cm.questions.entries()) {
    if (digits[k]! >= q.options.length) return null;
    cmA[q.id] = digits[k]!;
  }
  return { scores, cmA };
}

export function CareerTest() {
  const [phase, setPhase] = useState<"intro" | "test" | "result">("intro");
  const [ipA, setIpA] = useState<IpAnswers>({});
  const [cmA, setCmA] = useState<CmAnswers>({});
  const [i, setI] = useState(0);
  const [resume, setResume] = useState<Saved | null>(null);
  const [scores, setScores] = useState<RiasecScores | null>(null);
  const [ipResult, setIpResult] = useState<IpResult | null>(null);
  const [careers, setCareers] = useState<CareerAttrs[] | null>(null);
  const [zone, setZone] = useState(3);
  const [route, setRoute] = useState<ToolData | null>(null);
  const [copied, setCopied] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const shared = decode(window.location.hash);
      if (shared) {
        setScores(shared.scores);
        setCmA(shared.cmA);
        setZone(Math.min(readAnswers(shared.cmA).maxJobZone, 5));
        setPhase("result");
        return;
      }
      const s = load();
      if (s && (Object.keys(s.ipA).length || Object.keys(s.cmA).length)) setResume(s);
    });
  }, []);

  useEffect(() => {
    if (phase === "result" && !careers)
      fetch("/career-test-data.json")
        .then((r) => r.json() as Promise<CareerAttrs[]>)
        .then(setCareers, () => setCareers([]));
  }, [phase, careers]);

  useEffect(() => {
    headRef.current?.focus();
  }, [i, phase]);

  function start(from?: Saved) {
    setIpA(from?.ipA ?? {});
    setCmA(from?.cmA ?? {});
    setI(from?.i ?? 0);
    setPhase("test");
  }

  function finish(a: IpAnswers, c: CmAnswers) {
    const r = scoreInterestProfiler(a);
    setIpResult(r);
    setScores(r.scores);
    setZone(Math.min(readAnswers(c).maxJobZone, 5));
    window.history.replaceState(null, "", encode(r.scores, c));
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setPhase("result");
  }

  function next(nIp: IpAnswers, nCm: CmAnswers) {
    if (i < TOTAL - 1) {
      save({ ipA: nIp, cmA: nCm, i: i + 1 });
      setTimeout(() => setI(i + 1), 160);
    } else finish(nIp, nCm);
  }

  // ---------------- intro
  if (phase === "intro") {
    return (
      <div className="flex max-w-[900px] flex-col gap-5 rounded-lg border-[1.5px] border-mist bg-ice p-6 shadow-md md:p-8">
        <h2
          ref={headRef}
          tabIndex={-1}
          className="m-0 font-display text-[28px] font-bold outline-none focus-visible:shadow-none"
        >
          73 quick questions · about 12 minutes
        </h2>
        <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-slate">
          <li>
            <strong className="text-ink">Your interests:</strong> 60 work activities from the O*NET Interest Profiler.{" "}
            {ip.instructions}
          </li>
          <li>
            <strong className="text-ink">Your workday:</strong> 13 questions about people, schedule, pace, risk,
            training and pay.
          </li>
        </ol>
        <p className="m-0 text-small text-muted">
          No sign-up. Your answers stay in your browser and are never sent to us.
        </p>
        <div className="flex flex-wrap gap-3">
          {resume ? (
            <>
              <button
                type="button"
                onClick={() => start(resume)}
                className="h-[52px] rounded-full bg-primary px-6 text-ui font-extrabold text-white hover:bg-ink"
              >
                Continue ({Object.keys(resume.ipA).length + Object.keys(resume.cmA).length}/{TOTAL})
              </button>
              <button
                type="button"
                onClick={() => start()}
                className="h-[52px] rounded-full border-[1.5px] border-field-border bg-white px-6 text-ui font-extrabold"
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

  // ---------------- questions
  if (phase === "test") {
    const inIp = i < IP_N;
    const pct = Math.round((i / TOTAL) * 100);
    const btn = (on: boolean) =>
      `min-h-14 rounded-[14px] border-[1.5px] px-3 py-3 text-[16px] font-bold ${on ? "border-primary bg-primary text-white" : "border-field-border bg-white text-ink hover:border-primary"}`;
    return (
      <div className="flex max-w-[900px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2 text-small font-bold text-muted">
            <span>{inIp ? "Part 1 of 2 · Your interests" : "Part 2 of 2 · Your workday"}</span>
            <span>{inIp ? `Question ${i + 1} of ${IP_N}` : `Question ${i - IP_N + 1} of ${CM_N}`}</span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="h-2.5 flex-[60] overflow-hidden rounded-md bg-mist">
              <div className="h-full bg-accent" style={{ width: `${Math.min(100, (i / IP_N) * 100)}%` }} />
            </div>
            <div className="h-2.5 flex-[13] overflow-hidden rounded-md bg-mist">
              <div className="h-full bg-accent" style={{ width: `${inIp ? 0 : ((i - IP_N) / CM_N) * 100}%` }} />
            </div>
          </div>
          <span
            className="sr-only"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress"
          />
        </div>

        <section
          aria-labelledby="ct-q"
          className="flex flex-col gap-6 rounded-lg border-[1.5px] border-mist bg-white p-6 shadow-md md:p-8"
        >
          {inIp ? (
            <>
              <p className="m-0 text-muted">How would you feel about doing this work activity?</p>
              <h2
                id="ct-q"
                ref={headRef}
                tabIndex={-1}
                className="m-0 font-display text-[clamp(28px,4vw,40px)] leading-tight font-bold outline-none focus-visible:shadow-none"
              >
                {ip.items[i]!.text}
              </h2>
              <div role="radiogroup" aria-labelledby="ct-q" className="grid gap-2.5 md:grid-cols-5">
                {ip.scale.map((s) => {
                  const id = ip.items[i]!.id;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      role="radio"
                      aria-checked={ipA[id] === s.value}
                      onClick={() => {
                        const n = { ...ipA, [id]: s.value as IpAnswer };
                        setIpA(n);
                        next(n, cmA);
                      }}
                      className={btn(ipA[id] === s.value)}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            (() => {
              const q = cm.questions[i - IP_N]!;
              return (
                <>
                  <p className="m-0 text-muted">About the workday you want</p>
                  <h2
                    id="ct-q"
                    ref={headRef}
                    tabIndex={-1}
                    className="m-0 font-display text-[clamp(26px,3.5vw,36px)] leading-tight font-bold outline-none focus-visible:shadow-none"
                  >
                    {q.text}
                  </h2>
                  <div role="radiogroup" aria-labelledby="ct-q" className="grid gap-2.5 md:grid-cols-2">
                    {q.options.map((o, k) => (
                      <button
                        key={o.label}
                        type="button"
                        role="radio"
                        aria-checked={cmA[q.id] === k}
                        onClick={() => {
                          const n = { ...cmA, [q.id]: k };
                          setCmA(n);
                          next(ipA, n);
                        }}
                        className={btn(cmA[q.id] === k)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()
          )}
          <div className="flex justify-between">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => setI(i - 1)}
              className="h-12 rounded-full px-4 font-extrabold disabled:opacity-40"
            >
              ← Back
            </button>
          </div>
        </section>
        <p className="m-0 text-small text-muted">
          Part 1 uses the O*NET Interest Profiler Short Form by the U.S. Department of Labor, Employment and Training
          Administration, used unchanged under CC BY-ND 4.0. Your progress is saved in this browser.
        </p>
      </div>
    );
  }

  // ---------------- results
  return (
    <Results
      scores={scores!}
      ipResult={ipResult}
      cmA={cmA}
      careers={careers}
      zone={zone}
      setZone={setZone}
      route={route}
      setRoute={setRoute}
      copied={copied}
      onCopy={() => void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true))}
      onRetake={() => {
        window.history.replaceState(null, "", window.location.pathname);
        setCopied(false);
        setRoute(null);
        start();
      }}
      headRef={headRef}
    />
  );
}

function Results(props: {
  scores: RiasecScores;
  ipResult: IpResult | null;
  cmA: CmAnswers;
  careers: CareerAttrs[] | null;
  zone: number;
  setZone: (z: number) => void;
  route: ToolData | null;
  setRoute: (d: ToolData | null) => void;
  copied: boolean;
  onCopy: () => void;
  onRetake: () => void;
  headRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { scores, careers, zone, setZone, route, setRoute, cmA, copied, onCopy, onRetake, headRef } = props;
  const ranked = useMemo(() => [...RIASEC].sort((a, b) => scores[b] - scores[a]), [scores]);
  const code = ranked.slice(0, 3);
  const allZero = RIASEC.every((L) => scores[L] === 0);
  const flat = RIASEC.every((L) => scores[L] === scores.R);
  // areas outside the top 3 that tie with the 3rd one (the user picks, as the official form says)
  const ties = ranked.filter((L) => !code.includes(L) && scores[L] === scores[code[2]!]);
  const prefs = useMemo(() => readAnswers(cmA), [cmA]);
  const byZone = useMemo(() => (careers ? matchCareersByJobZone(scores, careers) : null), [careers, scores]);
  const ours = useMemo(() => (careers ? rankCareers(scores, prefs, careers, 12) : []), [careers, scores, prefs]);
  const ourSet = new Map(ours.map((c, k) => [c.slug, k]));
  const routeSteps = route ? route.rows.filter((r) => ourSet.has(r.slug)).slice(0, 3) : [];

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-labelledby="ct-result"
        className="grid gap-6 rounded-xl bg-ink p-6 text-white md:grid-cols-[1.2fr_1fr] md:p-9"
      >
        <div className="flex flex-col gap-4">
          <p className="m-0 text-small font-bold text-footer-muted">Your results · your answers stay in your browser</p>
          <p className="m-0 text-footer-text">Your interest code</p>
          <div className="flex gap-2.5">
            {code.map((L) => (
              <span
                key={L}
                className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-white font-display text-[34px] font-bold text-ink"
              >
                {L}
              </span>
            ))}
          </div>
          <h2
            id="ct-result"
            ref={headRef}
            tabIndex={-1}
            className="m-0 font-display text-[clamp(28px,3.5vw,40px)] leading-tight font-bold outline-none focus-visible:shadow-none"
          >
            {code.map((L) => AREA_TEXT[L]!.name).join(" · ")}
          </h2>
          <p className="m-0 text-footer-text">
            You are most drawn to {code.map((L) => AREA_TEXT[L]!.text).join("; ")}.
          </p>
          {ties.length > 0 && !flat && (
            <p className="m-0 text-small text-footer-muted">
              Tie: {[code[2]!, ...ties].map((L) => AREA_TEXT[L]!.name).join(" and ")} have the same score. Choose the
              one whose activities fit you best.
            </p>
          )}
          {allZero && (
            <p className="m-0 rounded-md bg-white/10 p-3 text-small">{ip.scoring.all_strongly_dislike_message}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onCopy} className="h-12 rounded-full bg-white px-5 font-extrabold text-ink">
              {copied ? "Link copied" : "Copy link to my results"}
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="h-12 rounded-full border-[1.5px] border-footer-rule px-5 font-extrabold text-white"
            >
              Retake the test
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg bg-white/5 p-5">
          <p className="m-0 font-bold">Your six interest scores</p>
          {RIASEC.map((L) => (
            <div key={L} className="grid grid-cols-[110px_1fr_48px] items-center gap-3 text-[16px]">
              <span>{AREA_TEXT[L]!.name}</span>
              <div className="h-2.5 overflow-hidden rounded-md bg-white/15" aria-hidden="true">
                <div className="h-full rounded-md bg-accent" style={{ width: `${(scores[L] / 40) * 100}%` }} />
              </div>
              <span className="text-right font-display tabular">{scores[L]}/40</span>
            </div>
          ))}
          <p className="m-0 text-small text-footer-muted">
            Scored with the O*NET Interest Profiler method (0–40 per area).
          </p>
        </div>
      </section>

      {/* Our ranking (interests + workday) */}
      <section aria-labelledby="ours" className="flex flex-col gap-4">
        <h2 id="ours" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
          Your best-fit careers
        </h2>
        <p className="m-0 max-w-[860px] text-slate">
          Our ranking: 60% how well each career’s O*NET interest profile matches yours, 40% how well its workday matches
          your answers in part 2. Careers that need more training than you chose are left out.
        </p>
        {!careers ? (
          <p className="m-0 text-muted">Loading careers…</p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {ours.map((c, k) => (
              <li key={c.slug}>
                <Link
                  href={`/careers/${c.slug}`}
                  className="flex h-full items-start gap-3 rounded-md border-[1.5px] border-mist p-4 text-ink no-underline hover:border-primary"
                >
                  <span className="font-display font-bold text-muted">{k + 1}</span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-bold">{c.title}</span>
                    <span className="text-small text-muted">
                      Fit {c.score} · interests {c.interest}
                      {c.careerMatch != null ? ` · workday ${c.careerMatch}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-display font-semibold tabular">
                    {money(careers.find((x) => x.slug === c.slug)?.median)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Route from current job */}
      <section
        aria-labelledby="route"
        className="flex flex-col gap-4 rounded-lg border-[1.5px] border-mist bg-panel p-6 md:p-8"
      >
        <h2 id="route" className="m-0 font-display text-[28px] font-bold">
          {route ? `Your route from ${route.name}` : "Add your current job to see your route"}
        </h2>
        <div className="max-w-[640px]">
          <JobPicker
            label="Your current job (optional)"
            buttonLabel="Show my route"
            onPick={(h) =>
              void fetch(`/career-change-data/${h.slug}.json`)
                .then((r) => (r.ok ? (r.json() as Promise<ToolData>) : null))
                .then((d) => setRoute(d))
            }
          />
        </div>
        {route &&
          (routeSteps.length ? (
            <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
              {routeSteps.map((r, k) => (
                <li key={r.slug} className="flex flex-col gap-1 rounded-md bg-white p-4">
                  <span className="text-small font-extrabold text-muted">Option {k + 1} · fits your results</span>
                  <Link href={`/careers/${r.slug}`} className="font-bold text-ink">
                    {r.title}
                  </Link>
                  <span className="text-[16px] tabular">
                    {r.match}% skill match · {money(r.median)}{" "}
                    {r.payChange != null && (
                      <span className={`font-bold ${payChangeTone(r.payChange)}`}>{signedPct(r.payChange)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="m-0">
              None of your best-fit careers is among the closest skill matches for {route.name}. See{" "}
              <Link href={`/career-change/from-${route.pageSlug}`}>all career changes from your job</Link>.
            </p>
          ))}
      </section>

      {/* Official Interest Profiler results */}
      <section aria-labelledby="official" className="flex flex-col gap-4">
        <h2 id="official" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
          Careers linked to your interests (O*NET method)
        </h2>
        <p className="m-0 max-w-[860px] text-slate">
          The official O*NET Interest Profiler way: careers whose interest profile matches the shape of yours, grouped
          by how much preparation they need. Best Fit and Great Fit are statistically strong matches.
        </p>
        <div role="group" aria-label="Preparation needed (Job Zone)" className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zone === z}
              onClick={() => setZone(z)}
              className={`min-h-11 rounded-full border-[1.5px] px-4 text-[16px] font-bold ${zone === z ? "border-primary bg-primary text-white" : "border-mist bg-white text-ink"}`}
            >
              Job Zone {z}
            </button>
          ))}
        </div>
        <p className="m-0 text-small font-bold text-muted">{JZ_LABEL[zone]}</p>
        {!byZone ? (
          <p className="m-0 text-muted">Loading…</p>
        ) : flat ? (
          <p className="m-0">
            All six scores are equal, so careers can’t be matched by interest shape. Try retaking the test.
          </p>
        ) : (byZone[zone] ?? []).length === 0 ? (
          <p className="m-0">
            Within this Job Zone, there are no careers that match your interest profile. Choose a different Job Zone
            above.
          </p>
        ) : (
          <>
            {(byZone[zone] ?? []).length < 7 && (
              <p className="m-0 text-small">
                Within this Job Zone, a small number of careers match your interest profile. Choose a different Job Zone
                above to see more.
              </p>
            )}
            <ul className="m-0 grid list-none gap-2.5 p-0 md:grid-cols-2">
              {(byZone[zone] ?? []).map((c) => (
                <li key={c.code}>
                  <Link
                    href={`/careers/${careers!.find((x) => x.code === c.code)?.slug}`}
                    className="flex justify-between gap-3 rounded-md border-[1.5px] border-mist px-4 py-3 text-ink no-underline hover:border-primary"
                  >
                    <span className="font-bold">{c.title}</span>
                    <span
                      className={`shrink-0 text-small font-extrabold ${c.fit === "Best Fit" ? "text-gain" : c.fit === "Great Fit" ? "text-primary" : "text-muted"}`}
                    >
                      {c.fit}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="m-0 text-small text-muted">
          This page includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor,
          Employment and Training Administration (USDOL/ETA). Used under the{" "}
          <a href="https://creativecommons.org/licenses/by-nd/4.0/" rel="noopener">
            CC BY-ND 4.0
          </a>{" "}
          license. O*NET® is a trademark of USDOL/ETA.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Link
          href="/big-five-personality-test"
          className="flex flex-col gap-2 rounded-lg bg-primary p-6 text-white no-underline hover:bg-ink hover:text-white"
        >
          <span className="font-display text-[22px] font-bold">Add your personality</span>
          <span>The Big Five Personality Test adds work-style strengths to these matches.</span>
          <span className="font-extrabold">Start the Big Five →</span>
        </Link>
        <Link
          href="/college-major-quiz"
          className="flex flex-col gap-2 rounded-lg border-[1.5px] border-mist p-6 text-ink no-underline hover:border-primary hover:text-ink"
        >
          <span className="font-display text-[22px] font-bold">Thinking about college?</span>
          <span className="text-muted">See which majors fit a {code.join("")} interest code.</span>
          <span className="font-extrabold text-primary">Take the College Major Quiz →</span>
        </Link>
      </section>
    </div>
  );
}
