import Link from "next/link";
import { money, payChangeTone, signedPct } from "@/lib/format";
import type { SimilarRow } from "@/lib/similarJobs";

export const JZ: Record<number, string> = {
  1: "Little or no preparation",
  2: "High school",
  3: "Training or associate",
  4: "Bachelor's degree",
  5: "Graduate degree",
};

function Pay({ r }: { r: SimilarRow }) {
  if (r.group)
    return (
      <>
        {money(r.median)}
        <span className="block font-sans text-small font-medium text-muted">Broader BLS group · not compared</span>
      </>
    );
  return (
    <>
      {money(r.median)}
      {r.payChange != null && (
        <span className={`block font-sans text-small font-bold ${payChangeTone(r.payChange)}`}>{signedPct(r.payChange)}</span>
      )}
    </>
  );
}

export function SimilarTable({ rows, name }: { rows: SimilarRow[]; name: string }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border-[1.5px] border-mist md:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">Careers most similar to {name}</caption>
          <thead>
            <tr className="border-b-[1.5px] border-mist bg-panel text-left">
              <th scope="col" className="w-[52px] px-5 py-4 text-small font-extrabold">#</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Career</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Similarity</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Median pay (vs. {name})</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Usual preparation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.slug} className="border-t border-mist align-top">
                <td className="px-5 py-3.5 font-display font-bold text-muted">{i + 1}</td>
                <td className="px-5 py-3.5">
                  <Link href={`/careers/${r.slug}`} className="font-bold text-ink decoration-accent decoration-2 underline-offset-4 hover:text-primary">
                    {r.title}
                  </Link>
                  {r.sameField && <span className="ml-2 rounded-sm bg-ice px-2 py-0.5 text-small font-bold text-muted">Same group</span>}
                </td>
                <td className="px-5 py-3.5 font-display font-bold tabular">{r.match}%</td>
                <td className="px-5 py-3.5 font-display font-semibold tabular">
                  <Pay r={r} />
                </td>
                <td className="px-5 py-3.5 text-[17px]">{r.jobZone ? JZ[r.jobZone] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0 md:hidden">
        {rows.map((r, i) => (
          <li key={r.slug} className="rounded-md border-[1.5px] border-mist p-4">
            <Link href={`/careers/${r.slug}`} className="font-bold text-ink">
              <span className="mr-2 font-display text-muted">{i + 1}</span>
              {r.title}
            </Link>
            <p className="m-0 mt-1 text-[16px] text-muted">
              <strong className="text-ink">{r.match}% similar</strong> · {money(r.median)}
              {r.group ? " (broader group)" : r.payChange != null ? ` (${signedPct(r.payChange)})` : ""} ·{" "}
              {r.jobZone ? JZ[r.jobZone] : "—"}
              {r.sameField ? " · Same group" : ""}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function MiniList({ rows, show }: { rows: SimilarRow[]; show: "pay" | "prep" }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <li key={r.slug}>
          <Link href={`/careers/${r.slug}`} className="flex h-full flex-col gap-1 rounded-[12px] border-[1.5px] border-mist bg-white px-5 py-4 text-ink no-underline hover:border-primary">
            <span className="font-bold">{r.title}</span>
            <span className="text-small text-muted">
              {r.match}% similar ·{" "}
              {show === "pay" ? (
                <>
                  {money(r.median)} <strong className={payChangeTone(r.payChange)}>({signedPct(r.payChange)})</strong>
                </>
              ) : (
                JZ[r.jobZone!]
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
