import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { CareerTable } from "@/components/career-change/CareerTable";
import {
  Bar,
  Breadcrumbs,
  FaqSection,
  FreeHelp,
  H2,
  JsonLd,
  PageTitle,
  RelatedLinks,
  SourcesBox,
  UpdatedLine,
} from "@/components/page/Common";
import { AgePage } from "@/components/situations/AgePage";
import { GovPage } from "@/components/situations/GovPage";
import { buildGovPage } from "@/lib/govPage";
import { RemotePage } from "@/components/situations/RemotePage";
import { buildRemotePage } from "@/lib/remotePage";
import { AGE_SLUGS, buildAgePage, type AgeSlug } from "@/lib/agePages";
import { buildFromPage } from "@/lib/careerChangePage";
import { careerChangeSources } from "@/lib/data/server";
import { money, payChangeTone, signedPct } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

// One route for /career-change/from-*, to-* and at-* (Next.js cannot name a folder "from-[job]").
// Phase 1 builds from-* pages; to-* and at-* come in phase 2.
export const dynamicParams = false;

// situation pages built so far (to-* pages follow)
const SITUATIONS: string[] = [...AGE_SLUGS, "to-government", "to-remote-work"];
const isAge = (s: string): s is AgeSlug => (AGE_SLUGS as readonly string[]).includes(s);

export function generateStaticParams() {
  return [...careerChangeSources().map((s) => ({ slug: `from-${s}` })), ...SITUATIONS.map((slug) => ({ slug }))];
}

function parse(slug: string) {
  return slug.startsWith("from-") ? buildFromPage(slug.slice(5)) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "to-remote-work") {
    const r = buildRemotePage();
    return pageMeta({ title: r.title, description: r.description, path: "/career-change/to-remote-work" });
  }
  if (slug === "to-government") {
    const g = buildGovPage();
    return pageMeta({ title: g.title, description: g.description, path: "/career-change/to-government" });
  }
  if (isAge(slug)) {
    const a = buildAgePage(slug);
    return pageMeta({ title: a.title, description: a.description, path: `/career-change/${slug}` });
  }
  const m = parse(slug);
  if (!m) return {};
  return pageMeta({ title: m.title, description: m.description, path: `/career-change/${slug}` });
}

export default async function CareerChangePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isAge(slug)) return <AgePage slug={slug} />;
  if (slug === "to-government") return <GovPage />;
  if (slug === "to-remote-work") return <RemotePage />;
  const m = parse(slug);
  if (!m) notFound();

  const url = `${SITE.url}/career-change/${slug}`;
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: `Jobs for Former ${m.name}` }]} />

      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Jobs for " highlight={`Former ${m.name}`} />
        <p className="m-0 text-lead">{m.intro}</p>
        <UpdatedLine />
      </section>

      <AdSlot size="leaderboard" id="cc-top" />

      <CareerTable rows={m.rows} skills={m.sourceSkills.map((s) => s.name)} sourceLabel={m.sourceLabel} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Jobs for former ${m.pluralLower}`,
          url,
          numberOfItems: m.rows.length,
          itemListElement: m.rows.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: r.title,
            url: `${SITE.url}/careers/${r.slug}`,
          })),
        }}
      />

      <AdSlot size="leaderboard" id="cc-mid" />

      <section className="flex flex-wrap gap-7">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4 rounded-lg border-[1.5px] border-mist bg-white p-6 shadow-md md:p-[30px]">
          <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.02em]">Your transferable skills</h2>
          <p className="m-0 text-[17px] text-muted">
            How important each skill is in {m.isHub ? `${m.pluralLower}’ work` : `work as ${m.pluralLower}`} (O*NET
            importance, scale 1–5).
          </p>
          {m.sourceSkills.slice(0, 6).map((s) => (
            <Bar key={s.name} label={s.name} value={s.value} />
          ))}
        </div>
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4 rounded-lg border-[1.5px] border-mist bg-ice p-6 shadow-md md:p-[30px]">
          <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.02em]">Skills to learn</h2>
          <p className="m-0 text-[17px] text-muted">The gaps that show up most often across your top 10 matches.</p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {m.skillsToLearn.map((g) => (
              <li key={g} className="flex items-center gap-3">
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-accent" />
                <strong>{g}</strong>
              </li>
            ))}
          </ul>
          <p className="m-0 text-small text-muted">
            Free and low-cost training: use the CareerOneStop training finder below.
          </p>
        </div>
      </section>

      <section aria-labelledby="up-close" className="flex flex-col gap-5">
        <H2 id="up-close">Your top 3 moves, up close</H2>
        <p className="m-0 max-w-[820px] text-slate">
          A concrete first step, the skills to add, and the hard parts of each job, from O*NET 31.0 education, training
          and work context data.
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
          {m.upClose.map((u) => (
            <article key={u.slug} className="flex flex-col gap-4 rounded-lg border-[1.5px] border-mist bg-white p-6">
              <header className="flex flex-col gap-1">
                <h3 className="m-0 text-h3">
                  <Link
                    href={`/careers/${u.slug}`}
                    className="text-ink decoration-accent decoration-2 underline-offset-4"
                  >
                    {u.title}
                  </Link>
                </h3>
                <p className="m-0 text-[16px] text-muted">
                  {u.match}% skill match · {money(u.median)}
                  {u.groupWage ? " (broader BLS group)" : ""}
                  {u.payChange != null && (
                    <>
                      {" · "}
                      <span className={`font-bold ${payChangeTone(u.payChange)}`}>{signedPct(u.payChange)} pay</span>
                    </>
                  )}
                </p>
              </header>
              {u.firstStep.length > 0 && (
                <div>
                  <h4 className="m-0 mb-1.5 text-small font-extrabold tracking-wide text-muted uppercase">
                    First step
                  </h4>
                  <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[17px]">
                    {u.firstStep.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
              {u.skillsToLearn.length > 0 && (
                <div>
                  <h4 className="m-0 mb-1.5 text-small font-extrabold tracking-wide text-muted uppercase">
                    Skills to add
                  </h4>
                  <p className="m-0 text-[17px]">{u.skillsToLearn.join(" · ")}</p>
                </div>
              )}
              <div>
                <h4 className="m-0 mb-1.5 text-small font-extrabold tracking-wide text-muted uppercase">
                  Is this right for you?
                </h4>
                {u.hardParts.length ? (
                  <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[17px]">
                    {u.hardParts.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-[17px]">No work-context factor stands out as unusually hard in O*NET data.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {m.similarInField.length > 0 && (
        <section aria-labelledby="same-field" className="flex flex-col gap-3.5">
          <h2 id="same-field" className="m-0 font-display text-[28px] font-bold">
            Similar roles in the same field
          </h2>
          <p className="m-0 text-slate">If you want to stay close to what you do now, these roles are the nearest.</p>
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {m.similarInField.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/careers/${s.slug}`}
                  className="block rounded-full border-[1.5px] border-mist px-4 py-2 text-[16px] font-bold text-ink no-underline hover:border-primary"
                >
                  {s.title} <span className="font-medium text-muted">{s.match}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FreeHelp who={`Former ${m.pluralLower}`} />

      <FaqSection title={`Questions former ${m.pluralLower} ask`} items={m.faq} />

      <RelatedLinks
        links={[
          ...m.members.slice(0, 3).map((x) => ({ label: `${x.title} career profile`, href: `/careers/${x.slug}` })),
          { label: "Transferable Skills Finder", href: "/transferable-skills" },
          { label: "Career Change Tool", href: "/career-change/tool" },
          { label: "Career change at 40", href: "/career-change/at-40" },
        ]}
        cta={{ label: "Take the Free Career Test", href: "/career-test" }}
      />

      <SourcesBox />
    </div>
  );
}
