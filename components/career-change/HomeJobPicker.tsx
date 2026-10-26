"use client";

import { useRouter } from "next/navigation";
import { JobPicker } from "./JobPicker";

/** Home hero picker: goes straight to the "Jobs for Former [job]" page. */
export function HomeJobPicker() {
  const router = useRouter();
  return <JobPicker onPick={(h) => router.push(`/career-change/from-${h.slug}`)} />;
}
