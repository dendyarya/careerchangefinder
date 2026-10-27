import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("methodology");

export default function Page() {
  return <StaticPage slug="methodology" />;
}
