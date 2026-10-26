import Link from "next/link";
import { meta } from "@/lib/data";
import { FOOTER_COLUMNS } from "@/lib/nav";

export function Footer() {
  const year = new Date(meta.built_at).getFullYear();
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1312px] grid-cols-2 gap-9 px-4 pt-16 pb-8 md:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))] md:px-8">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <span className="font-display text-[22px] font-bold">Career Change Finder</span>
          <span className="text-[16px] text-footer-text">Free career change tools built on U.S. government data.</span>
          <a href="mailto:contact@careerchangefinder.com" className="text-[16px] text-footer-link hover:text-white">
            contact@careerchangefinder.com
          </a>
        </div>
        {FOOTER_COLUMNS.map((c) => (
          <div key={c.title} className="flex flex-col gap-2.5 text-[16px]">
            <strong className="text-[16px]">{c.title}</strong>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-footer-text no-underline hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1312px] flex-col gap-2 border-t border-footer-rule px-4 pt-5 pb-10 text-small leading-relaxed text-footer-muted md:px-8">
        <p className="m-0">
          {meta.attribution.onet}{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            rel="noopener"
            className="text-footer-link hover:text-white"
          >
            License
          </a>
          .
        </p>
        <p className="m-0">
          {meta.attribution.bls} {meta.attribution.nces}
        </p>
        <p className="m-0">© {year} careerchangefinder.com · Not career, financial or psychological advice.</p>
      </div>
    </footer>
  );
}
