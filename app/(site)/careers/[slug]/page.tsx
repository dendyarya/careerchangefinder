import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { FitCheck } from "@/components/career/FitCheck";
import { Breadcrumbs, FreeHelp, H2, JsonLd, RelatedLinks, SourcesBox, UpdatedLine } from "@/components/page/Common";
import { buildProfile, profileSlugs } from "@/lib/careerProfile";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { stateSlug } from "@/lib/salary";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { RIASEC_NAMES } from "@/lib/soc";
import { alsoCalled } from "@/lib/seoName";

export const dynamicParams = false;
export const generateStaticParams = () => profileSlugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = buildProfile(slug);
  if (!m) return {};
  return pageMeta({ title: m.title, description: m.description, path: `/careers/${slug}`, noindex: m.o.thin });
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border-[1.5px] border-mist bg-white p-5">
      <p className="m-0 text-small font-extrabold text-muted">{label}</p>
      <p className="m-0 font-display text-[26px] leading-tight font-bold tabular">{value}</p>
      {note && <p className="m-0 text-small text-muted">{note}</p>}
    </div>
  );
}

function HBar({
  label,
  value,
  max,
  right,
  href,
}: {
  label: string;
  value: number;
  max: number;
  right: string;
  href?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 md:grid-cols-[180px_1fr_auto]">
      {href ? (
        <Link href={href} className="truncate text-ink">
          {label}
        </Link>
      ) : (
        <span className="truncate">{label}</span>
      )}
      <div className="h-2.5 overflow-hidden rounded-md bg-mist" aria-hidden="true">
        <div className="h-full rounded-md bg-primary" style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
      </div>
      <span className="font-display font-semibold tabular">{right}</span>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {items.map((s) => (
        <li key={s} className="rounded-full border-[1.5px] border-mist bg-white px-3.5 py-1.5 text-[16px] font-bold">
          {s}
        </li>
      ))}
    </ul>
  );
}

export default async function CareerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = buildProfile(slug);
  if (!m) notFound();
  const { o } = m;
  const w = o.wage;
  const fs = o.first_step;
  const top = m.states.slice(0, 5);
  const low = m.states.slice(-3).reverse();
  const maxState = m.states[0]?.median ?? 1;
  const holland = o.holland
    ? o.holland
        .split("")
        .map((l) => RIASEC_NAMES[l])
        .join(" · ")
    : null;
  const groupNote = w?.is_group ? `Pay for the broader BLS group “${w.bls_title}”` : undefined;
  const url = `${SITE.url}/careers/${slug}`;

  const toc = [
    m.fit.length ? ["fit", "Fit check"] : null,
    m.states.length ? ["pay", "Pay by state"] : null,
    ["work", "What they do"],
    ["edu", "Education"],
    o.riasec ? ["interests", "Interests"] : null,
    m.out.length || m.into.length ? ["change", "Career changes"] : null,
    o.majors.length ? ["majors", "Majors"] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div className="flex flex-col">
      <section className="border-b-[1.5px] border-mist bg-ice">
        <div className="mx-auto flex max-w-[1312px] flex-col gap-6 px-4 pt-8 pb-10 md:px-8">
          <Breadcrumbs
            items={[
              { name: "Careers", href: "/careers" },
              ...(m.group ? [{ name: m.group.short, href: `/careers/industry/${m.group.slug}` }] : []),
              { name: m.name },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex max-w-[860px] flex-col gap-3">
              <span className="text-small font-extrabold text-primary">
                {m.group?.short ?? "Career"}
                {fs.education_label ? ` · ${fs.education_label}` : ""}
              </span>
              <h1 className="m-0 text-h1 leading-[1.02] tracking-[-0.03em]">{m.name}</h1>
              {m.name !== o.title && <p className="m-0 text-small text-muted">O*NET title: {o.title}</p>}
              {alsoCalled(o.title, o.code) && <p className="m-0 text-small text-muted">Also called: {alsoCalled(o.title, o.code)}</p>}
              <p className="m-0 text-lead">{o.description}</p>
              {o.alt_titles.length > 0 && (
                <p className="m-0 text-[16px] text-muted">Also called: {o.alt_titles.slice(0, 6).join(", ")}</p>
              )}
            </div>
            {m.fit.length > 0 && (
              <a
                href="#fit"
                className="inline-flex h-[52px] items-center rounded-full bg-primary px-6 text-ui font-extrabold text-white no-underline hover:bg-ink hover:text-white"
              >
                Is this career right for me?
              </a>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Median pay"
              value={w?.median ? money(w.median) : "Not published"}
              note={groupNote ?? "per year, U.S."}
            />
            <Stat label="Pay range (10th–90th)" value={w?.p10 && w?.p90 ? `${money(w.p10)} – ${money(w.p90)}` : "—"} />
            <Stat
              label="People employed"
              value={w?.employment ? w.employment.toLocaleString("en-US") : "—"}
              note={w?.is_group ? "Whole BLS group" : undefined}
            />
            <Stat label="Holland code" value={o.holland ?? "—"} note={holland ?? undefined} />
          </div>
          {o.thin && (
            <p className="m-0 rounded-md bg-white p-4 text-[16px] text-slate">
              BLS does not publish full data for this job, or it is an “All Other” group, so some sections are missing.
            </p>
          )}
          <nav aria-label="On this page" className="flex flex-wrap gap-2">
            {toc.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border-[1.5px] border-mist bg-white px-4 py-1.5 text-[16px] font-bold text-ink no-underline hover:border-primary"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-12 px-4 pt-10 pb-[88px] md:px-8">
        <UpdatedLine />
        {m.fit.length > 0 && (
          <section
            id="fit"
            aria-labelledby="fit-h"
            className="flex scroll-mt-6 flex-col gap-4 rounded-lg border-[1.5px] border-mist bg-panel p-5 md:p-8"
          >
            <h2 id="fit-h" className="m-0 font-display text-[28px] font-bold">
              Is this career right for you?
            </h2>
            <p className="m-0 text-slate">
              These are the things that stand out in this job compared with other U.S. jobs (O*NET 31.0 work context).
              Answer honestly.
            </p>
            <FitCheck questions={m.fit.map(({ attr, text }) => ({ attr, text }))} nameLower={m.nameLower} />
            {o.downsides.length > 0 && (
              <div>
                <h3 className="m-0 mb-2 text-h3">The hard parts</h3>
                <ul className="m-0 list-disc pl-5">
                  {o.downsides.map((d) => (
                    <li key={d.factor}>{d.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <AdSlot size="leaderboard" id="profile-top" />

        {m.states.length > 0 && (
          <section id="pay" aria-labelledby="pay-h" className="flex scroll-mt-6 flex-col gap-5">
            <H2 id="pay-h">{m.name} pay by state</H2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h3 className="m-0 text-h3">Highest-paying states</h3>
                {top.map((s) => (
                  <HBar key={s.abbr} label={s.state} value={s.median} max={maxState} right={money(s.median)} href={o.thin ? undefined : `/careers/${o.slug}/salary#${stateSlug(s.state)}`} />
                ))}
              </div>
              {m.states.length > 5 && (
                <div className="flex flex-col gap-3">
                  <h3 className="m-0 text-h3">Lowest-paying states</h3>
                  {low.map((s) => (
                    <HBar key={s.abbr} label={s.state} value={s.median} max={maxState} right={money(s.median)} href={o.thin ? undefined : `/careers/${o.slug}/salary#${stateSlug(s.state)}`} />
                  ))}
                </div>
              )}
            </div>
            <p className="m-0 text-small text-muted">
              Annual median pay by state (
              {m.states.some((x) => x.abbr === "DC")
                ? `${m.states.length - 1} states and DC`
                : `${m.states.length} states`}{" "}
              with published data). Source: BLS OEWS May 2025
              {w?.is_group ? `, for the broader group “${w.bls_title}”` : ""}.
            </p>
            {!o.thin && (
              <p className="m-0">
                <Link href={`/careers/${o.slug}/salary`} className="font-extrabold">
                  {m.name} salary in every state →
                </Link>
              </p>
            )}
          </section>
        )}

        <section id="work" aria-labelledby="work-h" className="grid scroll-mt-6 gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-4">
            <H2 id="work-h">What {m.nameLower} do</H2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {o.tasks.slice(0, 6).map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-display font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border-[1.5px] border-mist p-6">
            {o.essential_skills.length > 0 && (
              <>
                <h3 className="m-0 text-h3">Skills that matter most</h3>
                <Chips items={o.essential_skills.map((s) => s.name)} />
              </>
            )}
            {o.knowledge.length > 0 && (
              <>
                <h3 className="m-0 text-h3">Knowledge</h3>
                <Chips items={o.knowledge.slice(0, 5).map((s) => s.name)} />
              </>
            )}
            {o.work_styles.length > 0 && (
              <>
                <h3 className="m-0 text-h3">Work styles that stand out</h3>
                <Chips items={o.work_styles} />
              </>
            )}
          </div>
        </section>

        <section id="edu" aria-labelledby="edu-h" className="grid scroll-mt-6 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H2 id="edu-h">Education and first steps</H2>
            {o.education_dist.length > 0 ? (
              <>
                {o.education_dist.map((e) => (
                  <div key={e.category} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-4 text-[17px]">
                      <span>{e.label}</span>
                      <span className="font-display font-semibold tabular">{Math.round(e.pct)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-md bg-mist" aria-hidden="true">
                      <div className="h-full rounded-md bg-primary" style={{ width: `${Math.max(1, e.pct)}%` }} />
                    </div>
                  </div>
                ))}
                <p className="m-0 text-small text-muted">
                  Share of workers by required education, as reported to O*NET.
                </p>
              </>
            ) : (
              <p className="m-0 text-slate">O*NET has no education survey data for this job.</p>
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border-[1.5px] border-mist bg-ice p-6">
            <h3 className="m-0 text-h3">How people get started</h3>
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
              {fs.education_label && (
                <li>
                  {fs.education_label} (O*NET Job Zone {fs.job_zone}).
                </li>
              )}
              {fs.related_experience?.label && (
                <li>Related work experience: {fs.related_experience.label.toLowerCase()}.</li>
              )}
              {fs.on_the_job_training?.label && (
                <li>On-the-job training: {fs.on_the_job_training.label.toLowerCase()}.</li>
              )}
              {fs.certification_note && <li>{fs.certification_note}.</li>}
            </ul>
            <p className="m-0 text-small text-muted">
              Most common answers from O*NET 31.0 Education, Training and Experience.
            </p>
          </div>
        </section>

        {o.riasec && (
          <section id="interests" aria-labelledby="int-h" className="flex scroll-mt-6 flex-col gap-4">
            <H2 id="int-h">Interest fit (Holland code)</H2>
            <div className="grid gap-3 md:max-w-[760px]">
              {Object.entries(RIASEC_NAMES).map(([k, n]) => (
                <HBar
                  key={k}
                  label={n}
                  value={o.riasec![k] ?? 0}
                  max={7}
                  right={(o.riasec![k] ?? 0).toFixed(2)}
                  href={`/careers/holland-code/${n.toLowerCase()}`}
                />
              ))}
            </div>
            <p className="m-0 text-small text-muted">
              O*NET occupational interest scores, scale 1–7. <Link href="/career-test">Take the Free Career Test</Link>{" "}
              to compare with your own.
            </p>
          </section>
        )}

        {(m.out.length > 0 || m.into.length > 0) && (
          <section id="change" aria-labelledby="change-h" className="flex scroll-mt-6 flex-col gap-5">
            <H2 id="change-h">Career changes</H2>
            <div className="grid gap-6 lg:grid-cols-2">
              {m.out.length > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border-[1.5px] border-mist p-6">
                  <h3 className="m-0 text-h3">Change from {m.nameLower}</h3>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {m.out.map((t) => (
                      <li key={t.slug} className="flex flex-wrap justify-between gap-2">
                        <Link href={`/careers/${t.slug}`} className="font-bold text-ink">
                          {t.title}
                        </Link>
                        <span className="text-[16px] text-muted tabular">
                          {t.match}% ·{" "}
                          <span className={t.group ? "" : `font-bold ${payChangeTone(t.payChange)}`}>
                            {t.group ? "group pay" : signedPct(t.payChange)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {m.fromPage && (
                    <Link href={m.fromPage} className="font-extrabold">
                      See all jobs for former {m.nameLower} →
                    </Link>
                  )}
                </div>
              )}
              {m.into.length > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border-[1.5px] border-mist p-6">
                  <h3 className="m-0 text-h3">Change into {m.nameLower}</h3>
                  <p className="m-0 text-[16px] text-muted">
                    Jobs whose skills carry over best (skill match, their median pay).
                  </p>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {m.into.map((t) => (
                      <li key={t.slug} className="flex flex-wrap justify-between gap-2">
                        <Link href={`/careers/${t.slug}`} className="font-bold text-ink">
                          {t.title}
                        </Link>
                        <span className="text-[16px] text-muted tabular">
                          {t.match}% · {money(t.median)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/jobs-similar-to/${slug}`} className="font-extrabold">
                    Jobs similar to {m.nameLower} →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {o.majors.length > 0 && (
          <section id="majors" aria-labelledby="majors-h" className="flex scroll-mt-6 flex-col gap-4">
            <H2 id="majors-h">Majors that lead here</H2>
            <Chips items={o.majors.map((x) => x.title)} />
            <p className="m-0 text-small text-muted">From the NCES CIP 2020 to SOC 2018 crosswalk.</p>
          </section>
        )}

        <FreeHelp />

        <RelatedLinks
          links={[
            ...(m.fromPage ? [{ label: `Jobs for former ${m.nameLower}`, href: m.fromPage }] : []),
            ...(o.thin ? [] : [{ label: `Jobs similar to ${m.nameLower}`, href: `/jobs-similar-to/${slug}` }]),
            ...(m.group ? [{ label: `More ${m.group.short} careers`, href: `/careers/industry/${m.group.slug}` }] : []),
            { label: "Career Change Tool", href: `/career-change/tool?job=${slug}` },
          ]}
          cta={{ label: "Take the Free Career Test", href: "/career-test" }}
        />
        <SourcesBox>
          O*NET 31.0 Database (USDOL/ETA, CC BY 4.0): description, tasks, skills, knowledge, work styles, education,
          interests and work context. Pay and employment: BLS OEWS May 2025 (national and state). Majors: NCES CIP 2020
          to SOC 2018 crosswalk.
        </SourcesBox>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Occupation",
          name: o.title,
          description: o.description,
          url,
          occupationalCategory: o.code.slice(0, 7),
          ...(o.alt_titles.length ? { alternateName: o.alt_titles.slice(0, 10) } : {}),
          ...(o.tasks.length ? { responsibilities: o.tasks.slice(0, 6) } : {}),
          ...(o.essential_skills.length ? { skills: o.essential_skills.map((s) => s.name).join(", ") } : {}),
          ...(fs.education_label ? { educationRequirements: fs.education_label } : {}),
          ...(w?.median && !w.is_group
            ? {
                estimatedSalary: {
                  "@type": "MonetaryAmountDistribution",
                  name: "base",
                  currency: "USD",
                  duration: "P1Y",
                  ...(w.p10 ? { percentile10: w.p10 } : {}),
                  ...(w.p25 ? { percentile25: w.p25 } : {}),
                  median: w.median,
                  ...(w.p75 ? { percentile75: w.p75 } : {}),
                  ...(w.p90 ? { percentile90: w.p90 } : {}),
                },
                occupationLocation: { "@type": "Country", name: "United States" },
              }
            : {}),
          mainEntityOfPage: url,
        }}
      />
    </div>
  );
}
