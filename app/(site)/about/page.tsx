import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("about");

export default function Page() {
  return <StaticPage slug="about" />;
}
