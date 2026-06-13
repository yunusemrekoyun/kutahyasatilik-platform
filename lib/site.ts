// Marka & iletişim bilgileri.
// Üretimde bu değerler admin > ayarlar üzerinden (Setting tablosu) değiştirilebilir;
// burada güvenli varsayılanlar tutulur ve env ile geçilebilir.

export const SITE = {
  name: "Kütahya Satılık",
  brand: "Kütahya'nın Dijital Emlak Ofisi",
  domain: "kutahyasatilik.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://kutahyasatilik.com",
  // İletişim (admin panelden güncellenebilir, env ile override edilebilir)
  phone: process.env.NEXT_PUBLIC_PHONE || "+90 532 000 00 00",
  phoneRaw: (process.env.NEXT_PUBLIC_PHONE || "+905320000000").replace(/[^\d+]/g, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "905320000000",
  email: process.env.NEXT_PUBLIC_EMAIL || "info@kutahyasatilik.com",
  address: "Kütahya Merkez",
  // Google Ads / Analytics
  gtagId: process.env.NEXT_PUBLIC_GTAG_ID || "", // örn: AW-XXXXXXXXX
  gaId: process.env.NEXT_PUBLIC_GA_ID || "", // örn: G-XXXXXXXXX
  adsConversionLabel: process.env.NEXT_PUBLIC_ADS_CONVERSION_LABEL || "",
  description:
    "Kütahya'da satılık daire, arsa, villa ve yatırımlık tarla. Kütahya'nın dijital emlak ofisi — telefon, WhatsApp ve randevu ile hızlı iletişim.",
};

export function whatsappLink(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${SITE.whatsapp}${text}`;
}

export function telLink() {
  return `tel:${SITE.phoneRaw}`;
}
