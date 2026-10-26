import Link from "next/link";
import { Breadcrumbs, PageTitle, SourcesBox } from "@/components/page/Common";
import { careerChangeSources, hubData, occBySlug } from "@/lib/data/server";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Career Change by Current Job: A–Z List",
  description:
    "Pick the job you have now to see careers that use your skills, ranked by skill match, with BLS median pay and pay change. Covers every U.S. job with full data.",
  path: "/career-change/from",
});

export default function FromIndex() {
  const items = careerChangeSources()
    .map((s) => {
      const h = hubData(s);
      return { slug: s, label: h ? `${h.plural} (popular)` : occBySlug(s)!.title };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const k = it.label[0]!.toUpperCase();
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  const letters = [...groups.keys()];
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Career Change", href: "/career-change" }, { name: "Careers A–Z" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Change careers from " highlight="any job" />
        <p className="m-0 text-lead">
          {items.length} jobs, A to Z. Choose yours to see the careers that use your skills.
        </p>
      </section>
      <nav aria-label="Letters" className="flex flex-wrap gap-2">
        {letters.map((l) => (
          <a
            key={l}
            href={`#letter-${l}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-mist font-bold text-ink no-underline hover:border-primary"
          >
            {l}
          </a>
        ))}
      </nav>
      <div className="columns-1 gap-10 sm:columns-2 lg:columns-3">
        {letters.map((l) => (
          <section key={l} id={`letter-${l}`} aria-label={l} className="mb-8 break-inside-avoid">
            <h2 className="m-0 mb-3 font-display text-[28px] font-bold">{l}</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {groups.get(l)!.map((it) => (
                <li key={it.slug}>
                  <Link href={`/career-change/from-${it.slug}`} className="text-ink">
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <SourcesBox />
    </div>
  );
}
