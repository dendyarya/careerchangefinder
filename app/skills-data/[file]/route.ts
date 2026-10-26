import fs from "node:fs";
import path from "node:path";

// Static JSON per job: O*NET 31.0 transferable-skill importance (1-5) -> /skills-data/<slug>.json
export const dynamicParams = false;
const load = () =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "processed", "skills.json"), "utf8")) as Record<
    string,
    Record<string, number>
  >;

export function generateStaticParams() {
  return Object.keys(load()).map((s) => ({ file: `${s}.json` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const v = load()[file.replace(/\.json$/, "")];
  if (!v) return new Response("Not found", { status: 404 });
  return Response.json(v, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
