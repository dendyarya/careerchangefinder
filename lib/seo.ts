import type { Metadata } from "next";
import { SITE } from "./site";

const SUFFIX = ` | ${SITE.name}`;

/** Full <title>: adds the site name only when the result stays within 60 characters. */
export function fullTitle(t: string) {
  return t.length + SUFFIX.length <= 60 ? `${t}${SUFFIX}` : t;
}

export function pageMeta({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const full = fullTitle(title);
  return {
    title: { absolute: full },
    description,
    alternates: { canonical: path },
    openGraph: { title: full, description, url: path, type: "website", siteName: SITE.name },
    twitter: { card: "summary_large_image", title: full, description },
    ...(noindex || !SITE.indexable ? { robots: { index: false, follow: !noindex } } : {}),
  };
}
