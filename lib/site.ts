// Marka & iletişim bilgileri.
// Üretimde bu değerler admin > ayarlar üzerinden (Setting tablosu) değiştirilebilir;
// burada güvenli varsayılanlar tutulur ve env ile geçilebilir.

export const SITE = {
  name: "Kütahya Satılık",
  brand: "Kütahya'nın Dijital Emlak Ofisi",
  domain: "kutahyasatilik.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://kutahyasatilik.com",
  // İletişim VARSAYILANLARI (env ile). Asıl kaynak admin > Ayarlar (Setting) —
  // çalışma zamanında lib/contact.ts getSiteContact() bunları Setting ile ezer.
  // Sahte numara YOK: env/Setting boşsa telefon/WhatsApp butonları gizlenir.
  phone: process.env.NEXT_PUBLIC_PHONE || "",
  phoneRaw: (process.env.NEXT_PUBLIC_PHONE || "").replace(/[^\d+]/g, ""),
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/[^\d]/g, ""),
  email: process.env.NEXT_PUBLIC_EMAIL || "info@kutahyasatilik.com",
  address: process.env.NEXT_PUBLIC_ADDRESS || "Kütahya Merkez",
  // Google Ads / Analytics
  gtagId: process.env.NEXT_PUBLIC_GTAG_ID || "", // örn: AW-XXXXXXXXX
  gaId: process.env.NEXT_PUBLIC_GA_ID || "", // örn: G-XXXXXXXXX
  adsConversionLabel: process.env.NEXT_PUBLIC_ADS_CONVERSION_LABEL || "",
  description:
    "Kütahya'da satılık daire, arsa, villa ve yatırımlık tarla. Kütahya'nın dijital emlak ofisi — telefon, WhatsApp ve randevu ile hızlı iletişim.",
};

// Numara verilmezse undefined döner → çağıran taraf butonu gizler (sahte link olmaz).
export function whatsappLink(number: string, message?: string): string | undefined {
  if (!number) return undefined;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

export function telLink(phoneRaw: string): string | undefined {
  return phoneRaw ? `tel:${phoneRaw}` : undefined;
}
