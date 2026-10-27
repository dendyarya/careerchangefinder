import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { HomeJobPicker } from "@/components/career-change/HomeJobPicker";
import { Breadcrumbs, FaqSection, FreeHelp, H2, JsonLd, PageTitle, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { JZ_PREP } from "@/lib/agePages";
import { buildTarget } from "@/lib/careerTargets";
import { meta } from "@/lib/data";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";

const pct = (x: number | null | undefined) => (x == null ? "—" : `${Math.round(x * 100)}%`);
const th = "px-4 py-3.5 text-small font-extrabold";

export function TargetPage({ slug }: { slug: string }) {
  const m = buildTarget(slug)!;
  const url = `${SITE.url}/career-change/${slug}`;
  const p = m.primary;
  const stats: [string, string][] = [
    [m.members.length > 1 ? `Median pay, ${m.name}` : "Median pay", `${money(p.wage?.median)}${p.wage?.is_group ? " (BLS group)" : ""}`],
    ["Usual preparation", JZ_PREP[p.job_zone ?? 0] ?? "—"],
    ["Workers 45 or older", pct(m.age?.share_45_plus)],
    [m.members.length > 1 ? "Careers on this page" : "U.S. jobs", m.members.length > 1 ? String(m.members.length) : (m.members[0]?.jobs?.toLocaleString("en-US") ?? "—")],
  ];
  const title = m.heading;
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: `Career Change to ${title}` }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Career change to " highlight={m.h1} />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine sources="O*NET 31.0, BLS OEWS May 2025 and BLS CPS 2025" />
      </section>

      <dl className="m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border-[1.5px] border-mist bg-white p-5">
            <dt className="text-small font-bold text-muted">{k}</dt>
            <dd className="m-0 mt-1 font-display text-[24px] leading-tight font-bold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <AdSlot size="leaderboard" id={`${slug}-top`} />

      {m.from.length > 0 && (
        <section aria-labelledby="h-from" className="flex flex-col gap-4">
          <H2 id="h-from">The best jobs to switch from</H2>
          <p className="m-0 max-w-[860px] text-slate">
            Jobs whose skills carry over best into {m.members.length > 1 ? `these careers` : m.name.toLowerCase()}, by our
            career-change match score, with the skills people in that job usually need to build.
          </p>
          <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
            <table className="w-full min-w-[760px] border-collapse text-body">
              <caption className="sr-only">Best jobs to switch from</caption>
              <thead>
                <tr className="border-b-[1.5px] border-mist bg-panel text-left">
                  <th scope="col" className={th}>If you are now…</th>
                  {m.members.length > 1 && <th scope="col" className={th}>Best match</th>}
                  <th scope="col" className={th}>Match</th>
                  <th scope="col" className={th}>Your median pay now</th>
                  <th scope="col" className={th}>Skills to build</th>
                </tr>
              </thead>
              <tbody>
                {m.from.map((f) => (
                  <tr key={f.slug} className="border-t border-mist align-top">
                    <td className="px-4 py-3">
                      <Link href={`/career-change/from-${f.slug}`} className="font-bold text-ink">
                        {f.title}
                      </Link>
                    </td>
                    {m.members.length > 1 && (
                      <td className="px-4 py-3">
                        <Link href={`/careers/${f.to.slug}`} className="text-ink">
                          {f.to.title}
                        </Link>
                      </td>
                    )}
                    <td className="px-4 py-3 font-display font-semibold tabular">{f.match}%</td>
                    <td className="px-4 py-3 font-display font-semibold tabular">
                      {money(f.median)}
                      {f.group && <span className="block font-sans text-small font-medium text-muted">Broader BLS group</span>}
                    </td>
                    <td className="px-4 py-3 text-[16px]">{f.gaps.length ? f.gaps.join(", ") : "None big"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-small text-muted">
            Skills to build: skills that are at least 0.25 points more important in the new career (O*NET 31.0 importance,
            1–5). <Link href="/methodology">How we match careers</Link>
          </p>
        </section>
      )}

      <section aria-labelledby="h-need" className="flex flex-col gap-4">
        <H2 id="h-need">What you need to get in</H2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-lg border-[1.5px] border-mist bg-white p-5">
            <h3 className="m-0 text-h3">Education {m.members.length > 1 ? `(${m.name})` : ""}</h3>
            {m.edu.length ? (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {m.edu.map((e) => (
                  <li key={e.category}>
                    <strong className="tabular">{Math.round(e.pct)}%</strong> of workers say the job requires {String(e.label).toLowerCase()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0">O*NET does not publish an education breakdown for this career.</p>
            )}
            <p className="m-0 text-small text-muted">
              Usual preparation: {JZ_PREP[p.job_zone ?? 0] ?? "varies"} (O*NET 31.0 Job Zone).
              {p.first_step.on_the_job_training?.label ? ` Most common on-the-job training: ${p.first_step.on_the_job_training.label.toLowerCase()}.` : ""}
            </p>
          </div>
          {m.notes?.map((n) => (
            <div key={n.source.url} className="flex flex-col gap-2 rounded-lg border-[1.5px] border-[#F2D58A] bg-[#FFF9E8] p-5">
              <h3 className="m-0 text-h3">Licenses and requirements</h3>
              <p className="m-0">{n.text}</p>
              <p className="m-0 text-small text-muted">
                Source: <a href={n.source.url} rel="noopener">{n.source.label}</a>
              </p>
            </div>
          ))}
        </div>
      </section>

      {m.members.length > 1 && (
        <section aria-labelledby="h-members" className="flex flex-col gap-4">
          <H2 id="h-members">The careers on this page</H2>
          <div className="overflow-x-auto rounded-lg border-[1.5px] border-mist">
            <table className="w-full min-w-[720px] border-collapse text-body">
              <caption className="sr-only">Careers covered by this page</caption>
              <thead>
                <tr className="border-b-[1.5px] border-mist bg-panel text-left">
                  <th scope="col" className={th}>Career</th>
                  <th scope="col" className={th}>Median pay</th>
                  <th scope="col" className={th}>U.S. jobs</th>
                  <th scope="col" className={th}>Usual preparation</th>
                  <th scope="col" className={th}>Workers 45+</th>
                </tr>
              </thead>
              <tbody>
                {m.members.map((r) => (
                  <tr key={r.slug} className="border-t border-mist align-top">
                    <td className="px-4 py-3">
                      <Link href={`/careers/${r.slug}`} className="font-bold text-ink">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-display font-semibold tabular">
                      {money(r.median)}
                      {r.group && <span className="block font-sans text-small font-medium text-muted">Broader BLS group</span>}
                    </td>
                    <td className="px-4 py-3 font-display font-semibold tabular">{r.jobs == null ? "—" : r.jobs.toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-[17px]">{r.jobZone ? JZ_PREP[r.jobZone] : "—"}</td>
                    <td className="px-4 py-3 font-display font-semibold tabular">{pct(r.share45)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {m.alternatives.length > 0 && (
        <section aria-labelledby="h-alt" className="flex flex-col gap-4">
          <H2 id="h-alt">Similar careers to consider</H2>
          <p className="m-0 max-w-[860px] text-slate">The careers most like {m.name.toLowerCase()} by skills and daily work (O*NET 31.0).</p>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {m.alternatives.map((a) => (
              <li key={a.slug}>
                <Link href={`/careers/${a.slug}`} className="flex h-full flex-col gap-1 rounded-[12px] border-[1.5px] border-mist px-5 py-4 text-ink no-underline hover:border-primary">
                  <span className="font-bold">{a.title}</span>
                  <span className="text-small text-muted">
                    {a.similarity}% similar · {money(a.median)} · {a.job_zone ? JZ_PREP[a.job_zone] : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="h-you" className="flex flex-col gap-4 rounded-xl bg-ink p-6 text-white md:p-8">
        <h2 id="h-you" className="m-0 font-display text-[30px] font-bold">
          Check your own job
        </h2>
        <p className="m-0 max-w-[760px] text-footer-text">Enter your current job to see how close you already are.</p>
        <div className="max-w-[720px] rounded-lg bg-white p-5 text-ink">
          <HomeJobPicker />
        </div>
      </section>

      <FreeHelp />
      <FaqSection title={`Questions about switching to ${m.h1}`} items={m.faq} />
      <RelatedLinks
        links={[
          { label: `${m.name} career profile`, href: `/careers/${p.slug}` },
          ...(p.wage ? [{ label: `${m.name} salary by state`, href: `/careers/${p.slug}/salary` }] : []),
          { label: `Jobs similar to ${m.name.toLowerCase()}`, href: `/jobs-similar-to/${p.slug}` },
          { label: "Career change at 40", href: "/career-change/at-40" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />
      <SourcesBox />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Career Change to ${title}`,
          description: m.description,
          url,
          dateModified: meta.built_at,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
    </div>
  );
}
