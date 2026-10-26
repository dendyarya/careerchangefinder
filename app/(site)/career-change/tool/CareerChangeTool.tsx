"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CareerTable, type Row } from "@/components/career-change/CareerTable";
import { JobPicker } from "@/components/career-change/JobPicker";

interface ToolData {
  pageSlug: string;
  name: string;
  pluralLower: string;
  sourceLabel: string;
  skills: string[];
  rows: Row[];
}

const EDU_OPTIONS = [
  { id: "any", label: "Any amount", ok: () => true },
  { id: "none", label: "No extra education", ok: (r: Row) => r.extraEdu === "None" },
  {
    id: "upto-assoc",
    label: "Up to a certificate or associate",
    ok: (r: Row) => ["None", "High school diploma", "Certificate or associate"].includes(r.extraEdu),
  },
  { id: "upto-ba", label: "Up to a bachelor's degree", ok: (r: Row) => r.extraEdu !== "Graduate degree" },
];
const PAY_OPTIONS = [
  { id: "any", label: "Any pay", ok: () => true },
  { id: "no-cut", label: "No big pay cut (−10% or better)", ok: (r: Row) => r.payChange != null && r.payChange >= -10 },
  { id: "raise", label: "Pays more than now", ok: (r: Row) => r.payChange != null && r.payChange > 0 },
];

export function CareerChangeTool() {
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<ToolData | null>(null);
  const [error, setError] = useState(false);
  const [edu, setEdu] = useState("any");
  const [pay, setPay] = useState("any");

  // state is only set in the fetch callbacks (never synchronously in an effect)
  function loadJob(s: string) {
    return fetch(`/career-change-data/${s}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ToolData>) : Promise.reject(r.status)))
      .then(
        (d) => {
          setSlug(s);
          setData(d);
          setError(false);
        },
        () => setError(true),
      );
  }

  // ?job=<slug> lets other pages link straight into the tool
  useEffect(() => {
    const j = new URLSearchParams(window.location.search).get("job");
    if (j && /^[a-z0-9-]+$/.test(j)) void loadJob(j);
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const e = EDU_OPTIONS.find((o) => o.id === edu)!;
    const p = PAY_OPTIONS.find((o) => o.id === pay)!;
    return data.rows.filter((r) => e.ok(r) && p.ok(r));
  }, [data, edu, pay]);

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-[720px] rounded-lg border-[1.5px] border-mist bg-ice p-5 shadow-md md:p-6">
        <JobPicker
          onPick={(h) => {
            void loadJob(h.slug);
            const u = new URL(window.location.href);
            u.searchParams.set("job", h.slug);
            window.history.replaceState(null, "", u);
          }}
        />
        <p className="mt-3 mb-0 text-small text-muted">Free · no sign-up · your choice stays in your browser</p>
      </div>

      {error && (
        <p role="alert" className="m-0 font-bold text-loss">
          We don’t have career-change data for that job yet. Try a similar job title.
        </p>
      )}

      {data && (
        <>
          <fieldset className="m-0 flex flex-wrap gap-6 border-0 p-0">
            <legend className="mb-3 font-display text-[24px] font-bold">Filter the list for {data.name}</legend>
            <label className="flex flex-col gap-1.5 text-[16px] font-bold">
              Extra education I’m willing to do
              <select
                value={edu}
                onChange={(e) => setEdu(e.target.value)}
                className="h-12 rounded-[12px] border-[1.5px] border-field-border bg-white px-3 text-body font-medium"
              >
                {EDU_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[16px] font-bold">
              Pay
              <select
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="h-12 rounded-[12px] border-[1.5px] border-field-border bg-white px-3 text-body font-medium"
              >
                {PAY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <p className="m-0 text-small text-muted" aria-live="polite">
            Showing {rows.length} of {data.rows.length} matches. Careers with only a broader BLS group wage are left out
            of pay filters.
          </p>
          {rows.length > 0 ? (
            <CareerTable
              key={`${slug}-${edu}-${pay}`}
              rows={rows}
              skills={data.skills}
              sourceLabel={data.sourceLabel}
            />
          ) : (
            <p className="m-0 rounded-md bg-ice p-5">No matches with these filters. Try “Any amount” or “Any pay”.</p>
          )}
          <p className="m-0">
            <Link href={`/career-change/from-${data.pageSlug}`} className="font-extrabold">
              See the full page for former {data.pluralLower} — first steps, hard parts and free help →
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
