import { SITE } from "@/lib/site";
import { getSiteContact } from "@/lib/contact";

// Ana sayfa yapısal verisi (§15) — yerel arama görünürlüğü.
// Organization + RealEstateAgent + WebSite (schema.org).
export default async function HomeJsonLd() {
  const c = await getSiteContact();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        email: c.email,
        telephone: c.phoneRaw,
        areaServed: "Kütahya",
        description: SITE.description,
      },
      {
        "@type": "RealEstateAgent",
        "@id": `${SITE.url}/#realestateagent`,
        name: SITE.name,
        url: SITE.url,
        telephone: c.phoneRaw,
        email: c.email,
        areaServed: "Kütahya",
        address: { "@type": "PostalAddress", addressLocality: "Kütahya", addressCountry: "TR" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
