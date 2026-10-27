# AdSense, Google Analytics, consent and Search Console

Code: `lib/tracking.ts`, `components/Tracking.tsx`, `components/AdSlot.tsx` + `AdUnit.tsx`,
`components/PrivacySettingsLink.tsx`, `app/ads.txt/route.ts`, CSP in `next.config.ts`.
Nothing loads unless the **production** build (`SITE_ENV=production`) has these environment variables:

| Variable | Example | Where to find it |
|---|---|---|
| `ADSENSE_CLIENT` | `ca-pub-1234567890123456` | AdSense > Account > Account information (Publisher ID, add `ca-`) |
| `GA_MEASUREMENT_ID` | `G-AB12CD34EF` | Analytics > Admin > Data streams > Web |
| `GOOGLE_SITE_VERIFICATION` | `abc123…` | Search Console > Add property > URL prefix > HTML tag: the `content` value only |

Invalid values are ignored (checked with a pattern), so a typo never puts broken code on the page.
Ad unit IDs per size go in `config/ads.json` (empty = no fixed units; Auto ads can still run).

## What the site does

1. Before any Google tag: consent-mode defaults. Denied (ads and analytics storage) for the EEA, the UK and
   Switzerland, with `wait_for_update: 500`; granted elsewhere. `ads_data_redaction` is on.
2. The same inline script then adds GA4 (`gtag.js`) and the AdSense script (async), so the defaults are
   always set first. The AdSense script also loads Google's consent message (CMP) once a European
   regulations message is published in AdSense.
3. Footer link "Privacy and cookie settings" re-opens the consent message
   (`googlefc.callbackQueue.push(googlefc.showRevocationMessage)`), as AdSense requires.
4. `/ads.txt`: `google.com, pub-…, DIRECT, f08c47fec0942fa0`.
5. CSP: AdSense supports only a nonce-based strict CSP, which static pages cannot carry, so with Google
   tags on, scripts, frames, images and connections are limited to HTTPS (no domain list). Without the IDs
   the strict policy stays.

## Setup in the Google accounts (after the domain is live, Tahap 10)

1. **Search Console:** add the URL-prefix property `https://careerchangefinder.com/`, choose *HTML tag*, put the
   `content` value in `GOOGLE_SITE_VERIFICATION`, deploy, click *Verify*. Then submit `https://careerchangefinder.com/sitemap.xml`.
   (Alternative: a Domain property verified with a DNS TXT record, which also covers www.)
2. **Analytics:** create a GA4 property and a Web data stream for the domain; put the Measurement ID in
   `GA_MEASUREMENT_ID`. Under Admin > Data collection, leave Google Signals off unless needed.
3. **AdSense:** add the site, put the Publisher ID in `ADSENSE_CLIENT`, deploy, and confirm `/ads.txt` shows
   the line above. Request review.
4. **Privacy & messaging > European regulations:** create a message for careerchangefinder.com
   (3 choices: Consent, Do not consent, Manage options), set the privacy policy URL to
   `https://careerchangefinder.com/privacy`, publish it. In the message settings, tick
   *Enable consent mode for advertising purposes* and *Enable consent mode for analytics purposes*.
5. **Recommended, Privacy & messaging > US state regulations:** create the message for careerchangefinder.com
   and publish it. Google then shows a "Do not sell or share my personal information" option to visitors in
   the U.S. states whose privacy laws require it (California and others), and stops personalized ads for those
   who opt out. The Privacy Policy already explains this opt-out ("Your rights").
6. Check in a private window with a VPN in an EEA country: the message appears, the footer link re-opens it.

Sources: AdSense help 10961068 (European regulations messages), 16053245 (consent mode settings),
10959060 (revocation link), 16283098 (CSP); Tag Platform CSP guide.
