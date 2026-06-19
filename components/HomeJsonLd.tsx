import { SITE } from "@/lib/site";

// Ana sayfa yapısal verisi (§15) — yerel arama görünürlüğü.
// Organization + RealEstateAgent + WebSite (schema.org).
export default function HomeJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        email: SITE.email,
        telephone: SITE.phoneRaw,
        areaServed: "Kütahya",
        description: SITE.description,
      },
      {
        "@type": "RealEstateAgent",
        "@id": `${SITE.url}/#realestateagent`,
        name: SITE.name,
        url: SITE.url,
        telephone: SITE.phoneRaw,
        email: SITE.email,
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
