import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("disclaimer");

export default function Page() {
  return <StaticPage slug="disclaimer" />;
}
