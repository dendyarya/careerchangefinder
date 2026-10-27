import { renderCard } from "@/lib/ogRender";

export const dynamic = "force-static";

export function GET() {
  return renderCard({ eyebrow: "Free career tools", title: "Find a new career that uses the skills you already have", stat: { label: "Built on", value: "U.S. government data" } });
}
