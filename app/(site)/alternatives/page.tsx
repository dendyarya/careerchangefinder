import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("alternatives");

export default function Page() {
  return <StaticPage slug="alternatives" />;
}
