import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("privacy");

export default function Page() {
  return <StaticPage slug="privacy" />;
}
