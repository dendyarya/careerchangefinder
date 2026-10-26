"use client";

import Link from "next/link";
import { useState } from "react";
import { JobPicker } from "@/components/career-change/JobPicker";
import { compareSkills, type SkillRow } from "@/lib/skillsCompare";

type Vec = Record<string, number>;
interface Picked {
  slug: string;
  title: string;
  skills: Vec;
}

const fetchSkills = (slug: string) =>
  fetch(`/skills-data/${slug}.json`).then((r) => (r.ok ? (r.json() as Promise<Vec>) : Promise.reject(r.status)));

const STATUS: Record<SkillRow["status"], { label: string; cls: string }> = {
  carries: { label: "Carries over", cls: "bg-[#E7F5EF] text-gain" },
  build: { label: "Build up", cls: "bg-[#FBEDEE] text-loss" },
  less: { label: "Less needed", cls: "bg-ice text-muted" },
};

function Bar({ v }: { v: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-2.5 w-[80px] overflow-hidden rounded-md bg-mist" aria-hidden="true">
        <span className="block h-full rounded-md bg-primary" style={{ width: `${(v / 5) * 100}%` }} />
      </span>
      <span className="font-display tabular">{v.toFixed(2)}</span>
    </span>
  );
}

export function SkillsFinder() {
  const [mine, setMine] = useState<Picked | null>(null);
  const [target, setTarget] = useState<Picked | null>(null);
  const [error, setError] = useState("");

  const pick = (set: (p: Picked) => void) => (h: { slug: string; title: string }) =>
    void fetchSkills(h.slug).then(
      (skills) => {
        setError("");
        set({ slug: h.slug, title: h.title, skills });
      },
      () => setError("We don’t have skill data for that job. Try a similar job title."),
    );

  const mineSorted = mine ? Object.entries(mine.skills).sort((a, b) => b[1] - a[1]) : [];
  const rows = mine && target ? compareSkills(mine.skills, target.skills) : [];
  const carries = rows.filter((r) => r.status === "carries");
  const build = rows.filter((r) => r.status === "build");

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-[720px] rounded-lg border-[1.5px] border-mist bg-ice p-5 shadow-md md:p-6">
        <JobPicker label="1. Your current job" buttonLabel="Show my skills" onPick={pick(setMine)} />
      </div>
      {error && (
        <p role="alert" className="m-0 font-bold text-loss">
          {error}
        </p>
      )}

      {mine && (
        <section aria-labelledby="my-skills" className="flex flex-col gap-4">
          <h2 id="my-skills" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
            Your transferable skills as {mine.title}
          </h2>
          <p className="m-0 text-slate">
            How important each skill is in your job (O*NET 31.0 importance, 1–5). The top ones travel best.
          </p>
          <ol className="m-0 grid list-none gap-x-8 gap-y-2.5 p-0 md:grid-cols-2">
            {mineSorted.map(([n, v], k) => (
              <li
                key={n}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ${k < 8 ? "bg-panel font-bold" : ""}`}
              >
                <span>{n}</span>
                <Bar v={v} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {mine && (
        <div className="max-w-[720px] rounded-lg border-[1.5px] border-mist bg-ice p-5 shadow-md md:p-6">
          <JobPicker label="2. A job you’re considering" buttonLabel="Compare skills" onPick={pick(setTarget)} />
        </div>
      )}

      {mine && target && (
        <section aria-labelledby="compare" className="flex flex-col gap-4">
          <h2 id="compare" className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
            {mine.title} → {target.title}
          </h2>
          <p className="m-0 text-lead">
            <strong>{carries.length}</strong> important skills carry over and <strong>{build.length}</strong> need
            building up.
          </p>
          <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
            <table className="w-full border-collapse text-[17px]">
              <thead>
                <tr className="bg-panel text-left">
                  <th scope="col" className="px-4 py-3 text-small font-extrabold">
                    Skill
                  </th>
                  <th scope="col" className="px-4 py-3 text-small font-extrabold">
                    Your job
                  </th>
                  <th scope="col" className="px-4 py-3 text-small font-extrabold">
                    Target job
                  </th>
                  <th scope="col" className="px-4 py-3 text-small font-extrabold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-t border-mist">
                    <td className="px-4 py-2.5 font-bold">{r.name}</td>
                    <td className="px-4 py-2.5">
                      <Bar v={r.yours} />
                    </td>
                    <td className="px-4 py-2.5">
                      <Bar v={r.target} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-sm px-2.5 py-0.5 text-small font-extrabold ${STATUS[r.status].cls}`}>
                        {STATUS[r.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-small text-muted">
            Carries over: the target rates it 3 or higher and you already use it at least as much. Build up: the target
            needs it at least 0.25 points more. Source: O*NET 31.0 Transferable Skills (importance).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/careers/${target.slug}`}
              className="rounded-[14px] border-[1.5px] border-mist px-4 py-3 font-bold text-ink no-underline hover:border-primary"
            >
              {target.title} career profile
            </Link>
            <Link
              href={`/career-change/tool?job=${mine.slug}`}
              className="rounded-[14px] border-[1.5px] border-mist px-4 py-3 font-bold text-ink no-underline hover:border-primary"
            >
              Best matches for {mine.title}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
