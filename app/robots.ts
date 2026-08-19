import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /api/share/ AÇIKÇA serbest: paylaşım kartı ucu bilerek /api altında duruyor
      // ve her ilanın og:image'i o adres. Yalnız "/api/" yasağı kalınca Facebook,
      // WhatsApp ve X'in tarayıcıları görseli çekemiyor, link önizlemeleri boş
      // çıkıyordu. Robots kuralında en UZUN eşleşme kazanır, bu yüzden allow yeterli.
      allow: ["/", "/api/share/"],
      disallow: ["/admin", "/api/", "/emlakci/panel"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
