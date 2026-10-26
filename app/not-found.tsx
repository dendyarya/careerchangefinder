import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-[760px] px-4 py-20 text-center md:px-8">
        <p className="m-0 font-display text-[64px] font-bold text-accent">404</p>
        <h1 className="m-0 mt-2 text-h2">We couldn’t find that page</h1>
        <p className="mt-4 mb-0 text-lead text-slate">
          It may not be published yet, or the link may be wrong. Try a search, or start here:
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-[52px] items-center rounded-full bg-primary px-6 text-ui font-extrabold text-white no-underline hover:bg-ink hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/career-test"
            className="inline-flex h-[52px] items-center rounded-full border-[1.5px] border-field-border px-6 text-ui font-extrabold text-ink no-underline"
          >
            Free Career Test
          </Link>
        </div>
        <p className="mt-6 mb-0 text-small text-muted">
          Tip: press <kbd className="font-sans font-bold">/</kbd> to search careers.
        </p>
      </section>
    </SiteShell>
  );
}
