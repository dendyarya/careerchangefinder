import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("data-sources");

export default function Page() {
  return <StaticPage slug="data-sources" />;
}
