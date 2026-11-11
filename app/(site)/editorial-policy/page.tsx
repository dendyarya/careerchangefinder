import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("editorial-policy");

export default function Page() {
  return <StaticPage slug="editorial-policy" />;
}
