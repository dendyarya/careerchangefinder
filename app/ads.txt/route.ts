import { TRACKING } from "@/lib/tracking";

// Authorized Digital Sellers file for AdSense. f08c47fec0942fa0 is Google's certification authority ID.
export const dynamic = "force-static";

export function GET() {
  const id = TRACKING.adsenseClient?.replace(/^ca-/, "");
  if (!id) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${id}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
