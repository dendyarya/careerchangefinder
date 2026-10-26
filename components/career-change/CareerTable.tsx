"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money, payChangeTone, signedPct } from "@/lib/format";

export interface Row {
  slug: string;
  title: string;
  match: number;
  median: number | null;
  payChange: number | null;
  groupWage: string | null; // broader BLS group title when the pay is a group figure
  jobZone: number | null;
  extraEdu: string;
  skillImp: Record<string, number>;
}

const INITIAL = 10;

/**
 * Ranked careers table with the "Skills you enjoy" re-rank from the mockup.
 * With skills picked, rows are ordered by 60% skill match + 40% how important the picked skills
 * are in the target job (O*NET importance, 1–5). The skill match number itself never changes.
 */
export function CareerTable({ rows, skills, sourceLabel }: { rows: Row[]; skills: string[]; sourceLabel: string }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const ordered = useMemo(() => {
    if (!picked.length) return rows;
    const score = (r: Row) => {
      const vals = picked.map((s) => r.skillImp[s] ?? 0);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return 0.6 * r.match + 0.4 * (avg / 5) * 100;
    };
    return [...rows].sort((a, b) => score(b) - score(a) || b.match - a.match);
  }, [rows, picked]);
  const visible = showAll ? ordered : ordered.slice(0, INITIAL);

  return (
    <>
      <section
        aria-labelledby="skills-enjoy"
        className="flex flex-col gap-3.5 rounded-lg border-[1.5px] border-mist bg-panel p-5 md:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="skills-enjoy" className="m-0 font-display text-[24px] font-bold">
            Skills you enjoy
          </h2>
          <span className="text-[16px] text-muted">Pick the skills you want to keep using. The list re-ranks.</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {skills.map((s) => {
            const on = picked.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(on ? picked.filter((x) => x !== s) : [...picked, s])}
                className={`min-h-11 rounded-full border-[1.5px] px-4 py-2 text-[16px] font-bold ${on ? "border-primary bg-primary text-white" : "border-field-border bg-white text-ink hover:border-primary"}`}
              >
                <span aria-hidden="true">{on ? "✓ " : "+ "}</span>
                {s}
              </button>
            );
          })}
        </div>
        <p className="m-0 text-small text-muted" aria-live="polite">
          {picked.length
            ? `Sorted by skill match and the ${picked.length === 1 ? "skill" : "skills"} you picked.`
            : "Sorted by skill match."}
        </p>
      </section>

      <section aria-labelledby="careers-heading" className="flex flex-col gap-4">
        <h2 id="careers-heading" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
          {rows.length} careers that use your skills
        </h2>

        {/* desktop table */}
        <div className="hidden overflow-hidden rounded-lg border-[1.5px] border-mist md:block">
          <table className="w-full border-collapse text-body">
            <thead>
              <tr className="border-b-[1.5px] border-mist bg-panel text-left">
                {["#", "Career", "Skill match", "Median pay", "Pay change", "Extra education"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-4 text-small font-extrabold ${h === "#" ? "w-[52px]" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.slug} className="border-t border-mist align-top">
                  <td className="px-5 py-4 font-display font-bold text-muted">{i + 1}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/careers/${r.slug}`}
                      className="font-bold text-ink decoration-accent decoration-2 underline-offset-4 hover:text-primary"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <MatchBar value={r.match} />
                  </td>
                  <td className="px-5 py-4 font-display font-semibold tabular">
                    {money(r.median)}
                    {r.groupWage && <GroupNote title={r.groupWage} />}
                  </td>
                  <td className={`px-5 py-4 font-display font-semibold tabular ${payChangeTone(r.payChange)}`}>
                    {r.groupWage ? (
                      <span className="font-sans text-small font-medium text-muted">Not compared</span>
                    ) : (
                      signedPct(r.payChange)
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <EduTag text={r.extraEdu} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* phone cards */}
        <ol className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
          {visible.map((r, i) => (
            <li key={r.slug} className="rounded-md border-[1.5px] border-mist p-4">
              <div className="flex gap-3">
                <span className="font-display font-bold text-muted">{i + 1}</span>
                <Link
                  href={`/careers/${r.slug}`}
                  className="font-bold text-ink decoration-accent decoration-2 underline-offset-4"
                >
                  {r.title}
                </Link>
              </div>
              <div className="mt-3">
                <MatchBar value={r.match} />
              </div>
              <dl className="m-0 mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[16px]">
                <dt className="text-muted">Median pay</dt>
                <dd className="m-0 text-right font-display font-semibold tabular">{money(r.median)}</dd>
                <dt className="text-muted">Pay change</dt>
                <dd className={`m-0 text-right font-display font-semibold tabular ${payChangeTone(r.payChange)}`}>
                  {r.groupWage ? "Not compared" : signedPct(r.payChange)}
                </dd>
              </dl>
              {r.groupWage && <GroupNote title={r.groupWage} />}
              <div className="mt-2 flex items-center gap-2 text-[16px]">
                <span className="text-muted">Extra education</span>
                <EduTag text={r.extraEdu} />
              </div>
            </li>
          ))}
        </ol>

        {rows.length > INITIAL && (
          <div className="flex justify-center rounded-md bg-ice p-4">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              aria-expanded={showAll}
              className="h-[52px] rounded-[14px] border-[1.5px] border-mist bg-white px-6 text-ui font-extrabold text-ink hover:border-primary"
            >
              {showAll ? `Show top ${INITIAL}` : `Show all ${rows.length} careers`}
            </button>
          </div>
        )}
        <p className="m-0 text-small text-muted">
          {sourceLabel} Skill match is our estimate (0–99) from O*NET 31.0 skills, knowledge, work activities and
          interests, adjusted for preparation and big pay drops. Pay: BLS OEWS May 2025, national median.
        </p>
      </section>
    </>
  );
}

function MatchBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-block h-2.5 w-[90px] overflow-hidden rounded-md bg-mist" aria-hidden="true">
        <span className="block h-full rounded-md bg-accent" style={{ width: `${value}%` }} />
      </span>
      <span className="font-display font-semibold tabular">{value}%</span>
    </span>
  );
}

function EduTag({ text }: { text: string }) {
  const none = text === "None";
  return (
    <span
      className={`inline-block rounded-sm px-2.5 py-0.5 text-small font-bold ${none ? "bg-ice text-gain ring-1 ring-mist" : "bg-mist text-ink"}`}
    >
      {text}
    </span>
  );
}

function GroupNote({ title }: { title: string }) {
  return (
    <span className="mt-1 block font-sans text-small font-medium text-muted">
      Pay for the broader BLS group “{title}”
    </span>
  );
}
