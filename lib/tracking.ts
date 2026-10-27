/**
 * Google AdSense, Google Analytics 4 and Search Console verification (runbook Tahap 8).
 * Everything is switched on by build-time environment variables, and only on the production site
 * (SITE_ENV=production), so staging and local builds never load Google scripts or count visits.
 *
 *   ADSENSE_CLIENT            ca-pub-1234567890123456  (AdSense > Account > Account information)
 *   GA_MEASUREMENT_ID         G-XXXXXXXXXX             (Analytics > Admin > Data streams)
 *   GOOGLE_SITE_VERIFICATION  the content="…" value of Search Console's HTML-tag method
 *
 * Consent: Google's own CMP (AdSense > Privacy & messaging > European regulations message) is loaded by
 * the AdSense script. Before any Google tag runs we set consent-mode defaults: denied for the EEA, the UK
 * and Switzerland (the CMP updates them after the visitor chooses), granted elsewhere.
 */
import { SITE } from "@/lib/site";

const clean = (v: string | undefined, re: RegExp) => (v && re.test(v.trim()) ? v.trim() : null);

export const TRACKING = {
  adsenseClient: SITE.indexable ? clean(process.env.ADSENSE_CLIENT, /^ca-pub-\d{10,20}$/) : null,
  gaId: SITE.indexable ? clean(process.env.GA_MEASUREMENT_ID, /^G-[A-Z0-9]{4,15}$/) : null,
  siteVerification: SITE.indexable ? clean(process.env.GOOGLE_SITE_VERIFICATION, /^[A-Za-z0-9_-]{20,100}$/) : null,
};

/** EEA (EU 27 + Iceland, Liechtenstein, Norway), United Kingdom, Switzerland */
export const CONSENT_REGIONS = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
  "GB",
  "CH",
];

/**
 * One inline script: consent-mode defaults first, then it adds gtag.js and adsbygoogle.js itself, so the
 * defaults are always in place before any Google tag runs (React would hoist plain async tags into <head>,
 * ahead of the defaults). Built only from validated values.
 */
export function consentBootstrap(gaId: string | null, adsenseClient: string | null) {
  const denied = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  };
  const granted = {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  };
  return [
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}",
    `gtag('consent','default',${JSON.stringify({ ...denied, region: CONSENT_REGIONS, wait_for_update: 500 })});`,
    `gtag('consent','default',${JSON.stringify(granted)});`,
    "gtag('set','ads_data_redaction',true);",
    gaId ? `gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});` : "",
    "function addTag(src,cors){var s=document.createElement('script');s.async=true;s.src=src;if(cors)s.crossOrigin='anonymous';document.head.appendChild(s);}",
    gaId ? `addTag(${JSON.stringify(`https://www.googletagmanager.com/gtag/js?id=${gaId}`)});` : "",
    adsenseClient
      ? `addTag(${JSON.stringify(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`)},true);`
      : "",
  ].join("");
}
