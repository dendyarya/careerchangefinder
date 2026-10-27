import { StaticPage, staticMeta } from "@/components/page/StaticPage";

export const metadata = staticMeta("contact");

export default function Page() {
  return <StaticPage slug="contact" />;
}
