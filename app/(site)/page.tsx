import Link from "next/link";
import { careerCount, hubs } from "@/lib/data";

// Temporary home (Tahap 4). The full home page is template #4 in Tahap 5.
export default function Home() {
  return (
    <>
      <section className="bg-ice">
        <div className="mx-auto max-w-[1312px] px-4 py-14 md:px-8 md:py-[88px]">
          <h1 className="m-0 max-w-[760px] text-h1 leading-[1.02] tracking-[-0.03em]">
            Find your next career with the{" "}
            <span className="bg-[linear-gradient(transparent_62%,var(--color-sky)_62%)]">skills you already have</span>
          </h1>
          <p className="mt-6 mb-0 max-w-[620px] text-lead text-slate">
            Compare {careerCount.toLocaleString("en-US")} careers using O*NET and BLS data. See which jobs match your
            skills, what they pay, and what it takes to get there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/career-test"
              className="inline-flex h-[52px] items-center rounded-full bg-primary px-6 text-ui font-extrabold text-white no-underline hover:bg-ink hover:text-white"
            >
              Take the Free Career Test
            </Link>
            <Link
              href="/career-change/tool"
              className="inline-flex h-[52px] items-center rounded-full border-[1.5px] border-field-border bg-white px-6 text-ui font-extrabold text-ink no-underline"
            >
              Career Change Tool
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1312px] px-4 py-14 md:px-8">
        <h2 className="m-0 text-h2">Jobs for former…</h2>
        <ul className="m-0 mt-6 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4">
          {hubs.map((h) => (
            <li key={h.slug}>
              <Link
                href={`/career-change/from-${h.slug}`}
                className="block rounded-md border-[1.5px] border-mist bg-white px-4 py-3 font-bold text-ink no-underline hover:border-primary"
              >
                {h.plural}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 mb-0 text-small text-muted">This site is being built. Pages will open in stages.</p>
      </section>
    </>
  );
}
