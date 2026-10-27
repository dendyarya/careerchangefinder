import { ogCard } from "@/lib/ogCards";
import { renderCard } from "@/lib/ogRender";

// Built on first request, then kept in memory like the state salary pages (read-only releases).
export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams() {
  return [];
}

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const last = parts[parts.length - 1] ?? "";
  if (!last.endsWith(".png")) return new Response("Not found", { status: 404 });
  const pagePath = "/" + [...parts.slice(0, -1), last.slice(0, -4)].join("/");
  const card = ogCard(pagePath);
  if (!card) return new Response("Not found", { status: 404 });
  return renderCard(card);
}
