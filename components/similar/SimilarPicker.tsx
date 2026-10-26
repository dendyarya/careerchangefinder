"use client";

import { useRouter } from "next/navigation";
import { JobPicker } from "@/components/career-change/JobPicker";

/** Goes to /jobs-similar-to/[slug]; jobs without a full page go to their career profile instead. */
export function SimilarPicker({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  const ok = new Set(slugs);
  return (
    <JobPicker
      label="Find jobs similar to…"
      buttonLabel="Show similar jobs"
      onPick={(h) => router.push(ok.has(h.slug) ? `/jobs-similar-to/${h.slug}` : `/careers/${h.slug}`)}
    />
  );
}
