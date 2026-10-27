import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("terms");

export default function Page() {
  return <StaticPage slug="terms" />;
}
