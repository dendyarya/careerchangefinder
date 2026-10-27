import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import { TRACKING } from "@/lib/tracking";
import "./globals.css";

// Self-hosted (OFL) font files: no request to Google at build or run time.
const manrope = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space-grotesk",
  weight: "300 700",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: Free Career Change Tools and Career Test`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US" },
  // Only the production site may be indexed (staging and previews stay noindex).
  robots: SITE.indexable ? { index: true, follow: true } : { index: false, follow: false },
  // Search Console ownership (HTML-tag method), production only
  ...(TRACKING.siteVerification ? { verification: { google: TRACKING.siteVerification } } : {}),
};

export const viewport: Viewport = { themeColor: "#1D62AF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
