import { SiteShell } from "@/components/SiteShell";
import { JsonLd } from "@/components/page/Common";
import { SITE } from "@/lib/site";

// Organization + WebSite on every page. No SearchAction: Google retired the sitelinks search box in 2024.
const ORG = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/icon-512.png`,
      email: "contact@careerchangefinder.com",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      inLanguage: "en-US",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
  ],
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <JsonLd data={ORG} />
      {children}
    </SiteShell>
  );
}
