import Link from "next/link";
import { Breadcrumbs, PageTitle, SourcesBox } from "@/components/page/Common";
import { SimilarPicker } from "@/components/similar/SimilarPicker";
import { occBySlug } from "@/lib/data/server";
import { pageMeta } from "@/lib/seo";
import { similarSlugs } from "@/lib/similarJobs";

export const metadata = pageMeta({
  title: "Jobs Similar To Yours: Find Careers Like Any Job",
  description:
    "Pick any U.S. job and see the 20 careers most like it by skills, knowledge and daily work, with BLS pay and education compared. O*NET 31.0 data.",
  path: "/jobs-similar-to",
});

export default function SimilarIndex() {
  const slugs = similarSlugs();
  const items = slugs.map((s) => occBySlug(s)!).sort((a, b) => a.title.localeCompare(b.title));
  const letters = [...new Set(items.map((o) => o.title[0]!.toUpperCase()))];
  return (
    <div className="mx-auto flex max-w-[1312px] flex-col gap-10 px-4 pt-8 pb-[88px] md:px-8">
      <Breadcrumbs items={[{ name: "Jobs Similar To" }]} />
      <section className="flex max-w-[920px] flex-col gap-[18px]">
        <PageTitle before="Jobs " highlight="Similar To…" />
        <p className="m-0 text-lead">
          Pick a job to see the careers that use the most similar skills, knowledge and work, with pay and schooling
          compared. Similarity comes from O*NET 31.0; pay from BLS May 2025.
        </p>
      </section>
      <div className="max-w-[720px] rounded-lg border-[1.5px] border-mist bg-ice p-5 shadow-md md:p-6">
        <SimilarPicker slugs={slugs} />
      </div>
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
              {items
                .filter((o) => o.title[0]!.toUpperCase() === l)
                .map((o) => (
                  <li key={o.slug}>
                    <Link href={`/jobs-similar-to/${o.slug}`} className="text-ink">
                      Jobs similar to {o.title}
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
