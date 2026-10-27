import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { JZ_PREP } from "@/lib/agePages";
import { meta } from "@/lib/data";
import { FIELD_SLUGS, buildFieldPage, type FieldRow, type FieldSlug } from "@/lib/fieldPages";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { SITE } from "@/lib/site";

const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);

function Rows({ rows, start }: { rows: FieldRow[]; start: number }) {
  return (
    <>
      {rows.map((r, i) => (
        <tr key={r.slug} className="border-t border-mist align-top">
          <td className="px-4 py-3 font-display font-bold text-muted">{start + i + 1}</td>
          <td className="px-4 py-3">
            <Link href={`/careers/${r.slug}`} className="font-bold text-ink decoration-accent decoration-2 underline-offset-4 hover:text-primary">
              {r.title}
            </Link>
          </td>
          <td className="px-4 py-3 font-display font-semibold tabular">
            {money(r.median)}
            {r.group && <span className="block font-sans text-small font-medium text-muted">Broader BLS group</span>}
          </td>
          <td className="px-4 py-3 text-[17px]">{r.jobZone ? JZ_PREP[r.jobZone] : "—"}</td>
          <td className="px-4 py-3 font-display font-semibold tabular">{r.jobs == null ? "—" : r.jobs.toLocaleString("en-US")}</td>
          <td className="px-4 py-3 font-display font-semibold tabular">{pct(r.share45)}</td>
        </tr>
      ))}
    </>
  );
}

function FieldTable({ rows, caption, show = 25 }: { rows: FieldRow[]; caption: string; show?: number }) {
  const part = (list: FieldRow[], start: number, cap: string) => (
    <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
      <table className="w-full min-w-[760px] border-collapse text-body">
        <caption className="sr-only">{cap}</caption>
        <thead>
          <tr className="border-b-[1.5px] border-mist bg-panel text-left">
            <th scope="col" className="w-[48px] px-4 py-3.5 text-small font-extrabold">#</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Career</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Median pay</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Usual preparation</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">U.S. jobs</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Workers 45+</th>
          </tr>
        </thead>
        <tbody>
          <Rows rows={list} start={start} />
        </tbody>
      </table>
    </div>
  );
  const rest = rows.slice(show);
  return (
    <div className="flex flex-col gap-3">
      {part(rows.slice(0, show), 0, caption)}
      {rest.length > 0 && (
        <details>
          <summary className="cursor-pointer font-extrabold text-primary">Show the other {rest.length} careers</summary>
          <div className="mt-3">{part(rest, show, `${caption} (continued)`)}</div>
        </details>
      )}
    </div>
  );
}

export function FieldPage({ slug }: { slug: FieldSlug }) {
  const m = buildFieldPage(slug);
  const url = `${SITE.url}/career-change/${slug}`;
  const stats: [string, string][] = [
    [`${m.name[0]!.toUpperCase()}${m.name.slice(1)} careers`, `${m.all.length}`],
    ["U.S. jobs", m.jobsTotal.toLocaleString("en-US")],
    ["Two years of prep or less", `${m.entry.length}`],
  ];
  const others = FIELD_SLUGS.filter((s) => s !== slug);
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: `Career Change to ${m.h1[0]!.toUpperCase()}${m.h1.slice(1)}` }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change to " highlight={m.h1} />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="BLS OEWS May 2025, BLS CPS 2025 and O*NET 31.0" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[30px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <AdSlot size="leaderboard" id={`${slug}-top`} />

      {m.nursingSteps.length > 0 && (
        <section aria-labelledby="h-ladder" className="flex flex-col gap-4">
          <H2 id="h-ladder">The nursing ladder, step by step</H2>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {m.nursingSteps.map((s, i) => (
              <li key={s.codes.join()} className="flex flex-col gap-2 rounded-lg border-[1.5px] border-mist bg-white p-5 md:p-6">
                <p className="m-0 text-small font-extrabold text-muted">Step {i + 1}</p>
                <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
                  {s.rows.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/careers/${r.slug}`} className="text-h3 font-bold text-ink">
                        {r.title}
                      </Link>{" "}
                      <span className="text-muted">
                        {money(r.median)}
                        {r.jobs != null ? ` · ${r.jobs.toLocaleString("en-US")} jobs` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="m-0">{s.text}</p>
                <p className="m-0 text-small text-muted">
                  Source: <a href={s.source.url} rel="noopener">{s.source.label}</a>
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="h-entry" className="flex flex-col gap-4">
        <H2 id="h-entry">Ways into {m.name} with two years of preparation or less</H2>
        <p className="m-0 max-w-[860px] text-slate">
          {m.entry.length} careers that usually need training, a certificate or an associate degree, highest pay first.
          Supervisor and manager jobs are left out because they are usually filled by promotion.
        </p>
        <FieldTable rows={m.entry} caption={`${m.name} careers with two years of preparation or less`} show={15} />
      </section>

      <section aria-labelledby="h-start" className="flex flex-col gap-4">
        <H2 id="h-start">Coming from another job? The best starting points</H2>
        <p className="m-0 max-w-[860px] text-slate">
          Jobs outside {m.name} whose skills carry over best into a {m.name} career, by our career-change match score.
        </p>
        <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
          <table className="w-full min-w-[720px] border-collapse text-body">
            <caption className="sr-only">Jobs whose skills carry over best into {m.name}</caption>
            <thead>
              <tr className="border-b-[1.5px] border-mist bg-panel text-left">
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">If you are now…</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Best {m.name} match</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Match</th>
                <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Pay change</th>
              </tr>
            </thead>
            <tbody>
              {m.startTop.map((s) => (
                <tr key={s.fromSlug} className="border-t border-mist">
                  <td className="px-4 py-3">
                    <Link href={`/career-change/from-${s.fromSlug}`} className="font-bold text-ink">
                      {s.fromTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/careers/${s.toSlug}`} className="text-ink">
                      {s.toTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-display font-semibold tabular">{s.match}%</td>
                  <td className={`px-4 py-3 font-display font-semibold tabular ${payChangeTone(s.payChange)}`}>
                    {s.payChange == null ? "Not compared" : signedPct(s.payChange)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="h-all" className="flex flex-col gap-4">
        <H2 id="h-all">All {m.all.length} {m.name} careers</H2>
        <p className="m-0 max-w-[860px] text-slate">Most jobs first. Included: {m.rule}.</p>
        <FieldTable rows={m.all} caption={`All ${m.name} careers, most jobs first`} />
        <p className="m-0 text-small text-muted">
          Workers 45+: BLS CPS 2025 (Table 11b). “Broader BLS group”: pay is published only for a wider group of jobs;
          its jobs are not counted. <Link href="/methodology">Methodology</Link>
        </p>
      </section>

      <section aria-labelledby="h-you" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-8">
        <h2 id="h-you" className="m-0 font-display text-[30px] font-bold">
          Start from the job you have now
        </h2>
        <p className="m-0 max-w-[760px] text-footer-text">
          Enter your current job to see which careers use the skills you already have.
        </p>
        <div className="max-w-[720px] rounded-lg bg-white p-5 text-ink">
          <HomeJobPicker />
        </div>
      </section>

      <FreeHelp who={`People moving into ${m.name}`} />
      <FaqSection title={`Questions about moving into ${m.name}`} items={m.faq} />
      <RelatedLinks
        links={[
          ...others.map((s) => ({ label: `Career change to ${s.slice(3).replace("-", " ")}`, href: `/career-change/${s}` })),
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Career Change to ${m.h1}`,
          description: m.description,
          url,
          dateModified: meta.built_at,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${m.name} careers`,
          url,
          numberOfItems: m.all.length,
          itemListElement: m.all.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE.url}/careers/${r.slug}` })),
        }}
      />
    </div>
  );
}
