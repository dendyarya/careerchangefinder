import Link from "next/link";

/**
 * Affiliate disclosure (FTC Endorsement Guides: clear, near the links, before the reader clicks).
 * Put it at the top of any page or section that contains affiliate links, and mark each affiliate
 * link with rel="sponsored nofollow". See docs/affiliate.md.
 */
export function AffiliateNote() {
  return (
    <p role="note" className="m-0 rounded-md bg-ice px-4 py-3 text-small text-slate">
      <strong className="text-ink">Disclosure:</strong> some links on this page are affiliate links. If you buy
      through them we may earn a commission, at no extra cost to you. It never changes our data or rankings.{" "}
      <Link href="/disclaimer">Learn more</Link>
    </p>
  );
}
