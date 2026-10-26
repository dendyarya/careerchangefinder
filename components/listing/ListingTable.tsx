import Link from "next/link";
import { money } from "@/lib/format";
import type { ListRow } from "@/lib/listings";

const JZ: Record<number, string> = {
  1: "Little or no preparation",
  2: "High school",
  3: "Training or associate",
  4: "Bachelor's degree",
  5: "Graduate degree",
};

export function ListingTable({ rows, extraLabel }: { rows: ListRow[]; extraLabel?: string }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border-[1.5px] border-mist md:block">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr className="border-b-[1.5px] border-mist bg-panel text-left">
              <th scope="col" className="w-[52px] px-5 py-4 text-small font-extrabold">#</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Career</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Median pay</th>
              <th scope="col" className="px-5 py-4 text-small font-extrabold">Usual preparation</th>
              {extraLabel && <th scope="col" className="px-5 py-4 text-small font-extrabold">{extraLabel}</th>}
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
                </td>
                <td className="px-5 py-3.5 font-display font-semibold tabular">
                  {money(r.median)}
                  {r.group && <span className="block font-sans text-small font-medium text-muted">Broader BLS group</span>}
                </td>
                <td className="px-5 py-3.5 text-[17px]">{r.jobZone ? JZ[r.jobZone] : "—"}</td>
                {extraLabel && <td className="px-5 py-3.5 text-[17px]">{r.extra}</td>}
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
              {money(r.median)}
              {r.group ? " (broader group)" : ""} · {r.jobZone ? JZ[r.jobZone] : "—"}
              {r.extra ? ` · ${r.extra}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
