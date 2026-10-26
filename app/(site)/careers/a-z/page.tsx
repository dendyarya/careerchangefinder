import Link from "next/link";
import { Breadcrumbs, PageTitle, SourcesBox } from "@/components/page/Common";
import { occupations } from "@/lib/data/server";
import { money } from "@/lib/format";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "All Careers A–Z: U.S. Jobs With Median Pay",
  description:
    "Every U.S. career with full O*NET and BLS data, from A to Z, with national median pay. Open any career for education, skills and career-change options.",
  path: "/careers/a-z",
});

export default function AZ() {
  const items = occupations()
    .filter((o) => !o.thin)
    .sort((a, b) => a.title.localeCompare(b.title));
  const groups = new Map<string, typeof items>();
  for (const o of items) groups.set(o.title[0]!.toUpperCase(), [...(groups.get(o.title[0]!.toUpperCase()) ?? []), o]);
  const letters = [...groups.keys()];
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Careers", href: "/careers" }, { name: "A–Z" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="All careers " highlight="A–Z" />
        <p className="m-0 text-lead">{items.length} careers with full data. Pay is the BLS May 2025 national median.</p>
      </section>
      <nav aria-label="Letters" className="flex flex-wrap gap-2">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-mist font-bold text-ink no-underline hover:border-primary">
            {l}
          </a>
        ))}
      </nav>
      <div className="columns-1 gap-10 md:columns-2 lg:columns-3">
        {letters.map((l) => (
          <section key={l} id={`letter-${l}`} aria-label={l} className="mb-8 break-inside-avoid">
            <h2 className="m-0 mb-3 font-display text-[28px] font-bold">{l}</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {groups.get(l)!.map((o) => (
                <li key={o.slug} className="flex justify-between gap-3">
                  <Link href={`/careers/${o.slug}`} className="text-ink">
                    {o.title}
                  </Link>
                  <span className="shrink-0 text-small text-muted tabular">
                    {o.wage?.is_group ? "" : money(o.wage?.median)}
                  </span>
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
