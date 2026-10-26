import Link from "next/link";
import { Breadcrumbs, PageTitle } from "@/components/page/Common";
import { listGuides } from "@/lib/guides";
import { monthYear } from "@/lib/format";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Career Change and College Major Guides",
  description:
    "Practical guides on changing careers and choosing a college major, built on O*NET and BLS data: transferable skills, resumes, pay and training.",
  path: "/guides",
});

const SECTIONS = [
  { id: "career-change", title: "Career change guides" },
  { id: "choosing-a-major", title: "Choosing a major" },
] as const;

export default async function GuidesIndex() {
  const all = await listGuides();
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Guides" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle highlight="Guides" />
        <p className="m-0 text-lead">
          Step-by-step help for changing careers and choosing a major, with numbers from U.S. government data.
        </p>
      </section>
      {all.length === 0 && (
        <p className="m-0 rounded-md bg-ice p-6">The first guides are being written. Check back soon.</p>
      )}
      {SECTIONS.map((s) => {
        const items = all.filter((g) => g.category === s.id);
        if (!items.length) return null;
        return (
          <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-5">
            <h2 id={s.id} className="m-0 text-h2 leading-[1.08] tracking-[-0.03em]">
              {s.title}
            </h2>
            <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
              {items.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="flex h-full flex-col gap-2 rounded-lg border-[1.5px] border-mist bg-white p-6 text-ink no-underline hover:border-primary hover:text-ink"
                  >
                    {g.draft && (
                      <span className="self-start rounded-sm bg-loss px-2 text-small font-extrabold text-white">
                        Draft
                      </span>
                    )}
                    <span className="font-display text-[22px] leading-tight font-bold">{g.title}</span>
                    <span className="text-muted">{g.description}</span>
                    <span className="text-small text-muted">Updated {monthYear(g.updatedAt ?? g.publishedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
