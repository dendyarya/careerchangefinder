import { occBySlug } from "@/lib/data/server";
import { alsoCalled } from "@/lib/seoName";

/** "Also called: …" under the H1 when the page title uses a shorter name (lib/seoName.ts). */
export function AlsoCalled({ slug }: { slug: string }) {
  const o = occBySlug(slug);
  const s = o ? alsoCalled(o.title, o.code) : null;
  return s ? <p className="m-0 text-small text-muted">Also called: {s}</p> : null;
}
