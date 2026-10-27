import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Staging and previews: block everything. Production: allow, except the CMS and APIs, and list the sitemap.
export default function robots(): MetadataRoute.Robots {
  if (!SITE.indexable) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/keystatic", "/api/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
