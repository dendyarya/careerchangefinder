import fs from "node:fs";
import type { NextConfig } from "next";

// Occupations that are the only member of a "Jobs for Former" hub redirect to the hub (no duplicate pages).
function hubRedirects() {
  const hubs = JSON.parse(fs.readFileSync("data/processed/hubs.json", "utf8")) as Record<string, { codes: string[] }>;
  const occ = JSON.parse(fs.readFileSync("data/processed/occupations.json", "utf8")) as {
    code: string;
    slug: string;
  }[];
  const slugOf = new Map(occ.map((o) => [o.code, o.slug]));
  return Object.entries(hubs)
    .filter(([, h]) => h.codes.length === 1 && slugOf.has(h.codes[0]!))
    .map(([hub, h]) => ({
      source: `/career-change/from-${slugOf.get(h.codes[0]!)}`,
      destination: `/career-change/from-${hub}`,
      permanent: true,
    }));
}

// Security headers (runbook: "Keamanan website", part 3). CSP is a baseline here;
// it is tightened in Tahap 8 once the ad, analytics and consent scripts are known.
const csp = [
  "default-src 'self'",
  // React needs eval() only in development (better error stacks); never in production
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Keystatic (admin only) talks to GitHub from the browser.
const cspKeystatic = csp
  .replace("connect-src 'self'", "connect-src 'self' https://api.github.com https://github.com")
  .replace(
    "img-src 'self' data: blob:",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com",
  );

const common = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // on-demand pages (state salary) are cached in memory only: releases are read-only on the server
  experimental: { isrFlushToDisk: false },
  trailingSlash: false,
  poweredByHeader: false,
  agentRules: false,
  reactStrictMode: true,
  async redirects() {
    return hubRedirects();
  },
  async headers() {
    return [
      { source: "/:path*", headers: [...common, { key: "Content-Security-Policy", value: csp }] },
      {
        source: "/keystatic/:path*",
        headers: [
          ...common,
          { key: "Content-Security-Policy", value: cspKeystatic },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // anything that is not the production site is never indexed
      ...(process.env.SITE_ENV === "production"
        ? []
        : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
    ];
  },
};

export default nextConfig;
