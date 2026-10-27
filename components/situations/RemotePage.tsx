import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { JZ_PREP } from "@/lib/agePages";
import { meta } from "@/lib/data";
import { money } from "@/lib/format";
import { buildRemotePage, type RemoteRow } from "@/lib/remotePage";
import { SITE } from "@/lib/site";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const field = (t: string) => t.replace(/ occupations$/, "");

function RemoteTable({ rows, caption, show = 25 }: { rows: RemoteRow[]; caption: string; show?: number }) {
  const part = (list: RemoteRow[], start: number, cap: string) => (
    <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
      <table className="w-full min-w-[760px] border-collapse text-body">
        <caption className="sr-only">{cap}</caption>
        <thead>
          <tr className="border-b-[1.5px] border-mist bg-panel text-left">
            <th scope="col" className="w-[48px] px-4 py-3.5 text-small font-extrabold">#</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Career</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Median pay</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Usual preparation</th>
            <th scope="col" className="px-4 py-3.5 text-small font-extrabold">Teleworked in this field</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.slug} className="border-t border-mist align-top">
              <td className="px-4 py-3 font-display font-bold text-muted">{start + i + 1}</td>
              <td className="px-4 py-3">
                <Link href={`/careers/${r.slug}`} className="font-bold text-ink decoration-accent decoration-2 underline-offset-4 hover:text-primary">
                  {r.title}
                </Link>
              </td>
              <td className="px-4 py-3 font-display font-semibold tabular">{money(r.median)}</td>
              <td className="px-4 py-3 text-[17px]">{r.jobZone ? JZ_PREP[r.jobZone] : "—"}</td>
              <td className="px-4 py-3 font-display font-semibold tabular">
                {pct(r.groupShare)}
                <span className="block font-sans text-small font-medium text-muted">{field(r.groupTitle)}</span>
              </td>
            </tr>
          ))}
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

export function RemotePage() {
  const m = buildRemotePage();
  const url = `${SITE.url}/career-change/to-remote-work`;
  const t = m.total;
  const stats: [string, string][] = [
    ["Workers who teleworked", pct(t.share_teleworked)],
    ["Work hours done remotely", `${t.pct_hours_teleworked}%`],
    ["Careers on this page", `${m.main.length}`],
    ["Of these, 2 years of prep or less", `${m.noDegree.length}`],
  ];
  const maxShare = m.groups[0]!.share_teleworked;
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Remote Work" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change to " highlight="remote work" />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="BLS CPS 2025, BLS OEWS May 2025 and O*NET 31.0" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[30px] font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <AdSlot size="leaderboard" id="remote-top" />

      <section aria-labelledby="h-main" className="flex flex-col gap-4">
        <H2 id="h-main">{m.main.length} careers you can mostly do from home</H2>
        <p className="m-0 max-w-[860px] text-slate">
          Each one has tasks that can mostly be done remotely and pays more than the U.S. median. Fields where remote
          work is most common come first (the last column, BLS 2025), then highest pay.
        </p>
        <RemoteTable rows={m.main} caption="Careers that can mostly be done from home, by field telework rate, then pay" />
        <p className="m-0 text-small text-muted">
          “Can mostly be done from home” is our estimate from O*NET 31.0 work context and work activities, using the
          method of Dingel &amp; Neiman (2020). Whether a job is offered remotely is up to each employer: teaching, for
          example, can be done online, but only {pct(m.groups.find((g) => g.soc === "25")!.share_teleworked)} of
          education workers teleworked in 2025. Supervisor and manager jobs, and long licensed professions such as
          physicians and lawyers, are left out.{" "}
          <Link href="/methodology">Methodology</Link>
        </p>
      </section>

      <section aria-labelledby="h-nodeg" className="flex flex-col gap-4">
        <H2 id="h-nodeg">Remote-friendly careers without a bachelor&apos;s degree</H2>
        <p className="m-0 max-w-[860px] text-slate">
          The {m.noDegree.length} careers from the list above that usually take two years or less to prepare for.
        </p>
        <RemoteTable rows={m.noDegree} caption="Remote-friendly careers with two years or less of preparation" show={15} />
      </section>

      <section aria-labelledby="h-fields" className="flex flex-col gap-4">
        <H2 id="h-fields">How much people telework, by field</H2>
        <p className="m-0 max-w-[860px] text-slate">
          Share of workers who teleworked or worked at home for pay for at least some hours, 2025 (BLS).
        </p>
        <dl className="m-0 flex max-w-[920px] flex-col gap-2.5">
          {m.groups.map((g) => (
            <div key={g.soc} className="grid grid-cols-[minmax(0,1fr)_1.2fr_48px] items-center gap-3 md:grid-cols-[320px_1fr_56px]">
              <dt className="truncate">{field(g.title)}</dt>
              <span className="h-3.5 overflow-hidden rounded-md bg-mist" aria-hidden="true">
                <span className="block h-full rounded-md bg-primary" style={{ width: `${(g.share_teleworked / maxShare) * 100}%` }} />
              </span>
              <dd className="m-0 text-right font-display font-semibold tabular">{pct(g.share_teleworked)}</dd>
            </div>
          ))}
        </dl>
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

      <FreeHelp who="People looking for remote work" />
      <FaqSection title="Questions about remote careers" items={m.faq} />
      <RelatedLinks
        links={[
          { label: "Jobs for Introverts", href: "/careers/personality/introverts" },
          { label: "Career change at 40", href: "/career-change/at-40" },
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
          { label: "Career Change Tool", href: "/career-change/tool" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox>
        Telework: U.S. Bureau of Labor Statistics, Current Population Survey, 2025 annual averages, Table 62 (October
        2025 was not collected). Pay: BLS OEWS May 2025. Remote-friendly estimate: our application of Dingel, J. and
        Neiman, B. (2020), “How many jobs can be done at home?”, Journal of Public Economics 189, to O*NET 31.0,
        USDOL/ETA (CC BY 4.0).
      </SourcesBox>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Career Change to Remote Work",
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
          name: "Careers you can mostly do from home",
          url,
          numberOfItems: m.main.length,
          itemListElement: m.main.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title, url: `${SITE.url}/careers/${r.slug}` })),
        }}
      />
    </div>
  );
}
