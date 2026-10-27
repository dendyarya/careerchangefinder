import Link from "next/link";
import type { AgeRow } from "@/lib/agePages";
import { JZ_PREP } from "@/lib/agePages";
import { money } from "@/lib/format";

const pct = (x: number) => `${Math.round(x * 100)}%`;

function Rows({ rows, start }: { rows: AgeRow[]; start: number }) {
  return (
    <>
      {rows.map((r, i) => (
        <tr key={r.slug} className="border-t border-mist align-top">
          <td className="px-4 py-3 font-display font-bold text-muted">{start + i + 1}</td>
          <td className="px-4 py-3">
            <Link href={`/careers/${r.slug}`} className="font-bold text-ink decoration-accent decoration-2 underline-offset-4 hover:text-primary">
              {r.title}
            </Link>
            {r.note && (
              <a href={`#note-${r.slug}`} className="ml-2 rounded-sm bg-[#FFF4D6] px-2 py-0.5 text-small font-bold text-ink no-underline">
                Read before you start
              </a>
            )}
          </td>
          <td className="px-4 py-3 font-display font-semibold tabular">{money(r.median)}</td>
          <td className="px-4 py-3 text-[17px]">{JZ_PREP[r.jobZone]}</td>
          <td className="px-4 py-3 font-display font-semibold tabular">
            {pct(r.share)}
            {r.group && <span className="block font-sans text-small font-medium text-muted">Broader group</span>}
          </td>
          <td className="px-4 py-3 tabular">{r.medianAge == null ? "—" : r.medianAge.toFixed(1)}</td>
        </tr>
      ))}
    </>
  );
}

function Head({ caption, shareLabel }: { caption: string; shareLabel: string }) {
  return (
    <>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b-[1.5px] border-mist bg-panel text-left">
          <th scope="col" className="w-[48px] px-4 py-3.5 text-small font-extrabold">#</th>
          <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Career</th>
          <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Median pay</th>
          <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Usual preparation</th>
          <th scope="col" className="px-4 py-3.5 text-small font-extrabold">{shareLabel}</th>
          <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Median age</th>
        </tr>
      </thead>
    </>
  );
}

/** First `show` rows visible; the rest stay in the HTML inside <details> so every row is crawlable. */
export function AgeTable({
  rows,
  caption,
  shareLabel,
  show = 25,
}: {
  rows: AgeRow[];
  caption: string;
  shareLabel: string;
  show?: number;
}) {
  const first = rows.slice(0, show);
  const rest = rows.slice(show);
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
        <table className="w-full min-w-[760px] border-collapse text-body">
          <Head caption={caption} shareLabel={shareLabel} />
          <tbody>
            <Rows rows={first} start={0} />
          </tbody>
        </table>
      </div>
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer font-extrabold text-primary">Show the other {rest.length} careers</summary>
          <div className="mt-3 overflow-x-auto rounded-lg border-[1.5px] border-mist">
            <table className="w-full min-w-[760px] border-collapse text-body">
              <Head caption={`${caption} (continued)`} shareLabel={shareLabel} />
              <tbody>
                <Rows rows={rest} start={show} />
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export function AgeBars({ bands, total, highlight }: { bands: Record<string, number>; total: number; highlight: string[] }) {
  const max = Math.max(...Object.values(bands));
  return (
    <dl className="m-0 flex flex-col gap-2.5">
      {Object.entries(bands).map(([b, v]) => (
        <div key={b} className="grid grid-cols-[64px_1fr_56px] items-center gap-3">
          <dt className="tabular">{b}</dt>
          <span className="h-3.5 overflow-hidden rounded-md bg-mist" aria-hidden="true">
            <span className={`block h-full rounded-md ${highlight.includes(b) ? "bg-primary" : "bg-sky"}`} style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <dd className="m-0 text-right font-display font-semibold tabular">{Math.round((v / total) * 100)}%</dd>
        </div>
      ))}
    </dl>
  );
}
