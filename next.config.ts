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

// Security headers (runbook: "Keamanan website", part 3).
// Google tags (lib/tracking.ts) load only on production builds that have their IDs. AdSense supports only
// a nonce-based strict CSP, which static pages cannot carry, and its domains change without notice
// (support.google.com/adsense/answer/16283098), so with ads on, scripts, frames, images and connections
// are limited to HTTPS instead of a domain list. Everything else stays locked down.
const prod = process.env.SITE_ENV === "production";
const ads = prod && /^ca-pub-\d{10,20}$/.test(process.env.ADSENSE_CLIENT?.trim() ?? "");
const analytics = prod && /^G-[A-Z0-9]{4,15}$/.test(process.env.GA_MEASUREMENT_ID?.trim() ?? "");
const google = ads || analytics;
const csp = [
  "default-src 'self'",
  // React needs eval() only in development (better error stacks); AdSense's recommended policy allows it
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" || ads ? " 'unsafe-eval'" : ""}${google ? " https:" : ""}`,
  `style-src 'self' 'unsafe-inline'${ads ? " https:" : ""}`,
  `img-src 'self' data: blob:${google ? " https:" : ""}`,
  `font-src 'self'${ads ? " https:" : ""}`,
  `connect-src 'self'${google ? " https:" : ""}`,
  ...(google ? ["frame-src https:"] : []),
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
  // ad clicks open the advertiser in a new tab; strict same-origin can break that hand-off
  { key: "Cross-Origin-Opener-Policy", value: ads ? "same-origin-allow-popups" : "same-origin" },
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
