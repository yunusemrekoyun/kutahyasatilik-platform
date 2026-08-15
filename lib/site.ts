// Marka & iletişim bilgileri.
// Üretimde bu değerler admin > ayarlar üzerinden (Setting tablosu) değiştirilebilir;
// burada güvenli varsayılanlar tutulur ve env ile geçilebilir.

export const SITE = {
  name: "Kütahya Satılık",
  // K8: ürün genel ilan sitesi. "Emlak Ofisi" ifadesi vasıta ve teknoloji
  // ilanlarıyla çelişiyordu. Admin > Ayarlar bunu Setting ile ezebilir.
  brand: "Kütahya'nın Yerel İlan Platformu",
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
    "Kütahya'da satılık daire, arsa, villa, otomobil ve teknoloji ürünleri. Yerel ilan platformu — telefon, WhatsApp ve mesajla hızlı iletişim.",
};

// Numara verilmezse undefined döner → çağıran taraf butonu gizler (sahte link olmaz).
/**
 * wa.me bağlantısı — numara ULUSLARARASI biçime çevrilir.
 *
 * wa.me yalnız ülke koduyla başlayan, salt rakam bir numara kabul ediyor.
 * Ham girdi olduğu gibi verildiğinde ("0532 111 22 33", "+90 532...") bağlantı
 * sessizce açılmıyordu: danışman profillerindeki WhatsApp düğmesi, numarayı
 * Türkiye'de alışıldığı gibi sıfırla yazan her kullanıcıda kırıktı.
 */
export function whatsappLink(number: string, message?: string): string | undefined {
  if (!number) return undefined;
  let digits = number.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("00")) digits = digits.slice(2);
  // 0532... -> 90532... ;  532... -> 90532...
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telLink(phoneRaw: string): string | undefined {
  return phoneRaw ? `tel:${phoneRaw}` : undefined;
}
