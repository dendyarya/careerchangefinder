import { notFound } from "next/navigation";
import { keystaticEnabled } from "@/lib/keystatic-enabled";
import { KeystaticApp } from "./KeystaticApp";

export const dynamic = "force-dynamic";

export default function Page() {
  if (!keystaticEnabled) notFound();
  return <KeystaticApp />;
}
