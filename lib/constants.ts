// Kütahya ilçeleri (harita merkez koordinatları ile)
export const DISTRICTS = [
  { name: "Merkez", slug: "merkez", lat: 39.4242, lng: 29.9833 },
  { name: "Tavşanlı", slug: "tavsanli", lat: 39.5469, lng: 29.4936 },
  { name: "Simav", slug: "simav", lat: 39.0894, lng: 28.9783 },
  { name: "Gediz", slug: "gediz", lat: 39.0411, lng: 29.4144 },
  { name: "Emet", slug: "emet", lat: 39.3447, lng: 29.2603 },
  { name: "Domaniç", slug: "domanic", lat: 39.8003, lng: 29.6042 },
  { name: "Hisarcık", slug: "hisarcik", lat: 39.2503, lng: 29.2331 },
  { name: "Altıntaş", slug: "altintas", lat: 39.0686, lng: 30.1108 },
  { name: "Aslanapa", slug: "aslanapa", lat: 39.2167, lng: 29.8667 },
  { name: "Dumlupınar", slug: "dumlupinar", lat: 39.0667, lng: 29.95 },
  { name: "Çavdarhisar", slug: "cavdarhisar", lat: 39.2089, lng: 29.6164 },
  { name: "Pazarlar", slug: "pazarlar", lat: 39.2667, lng: 29.3667 },
  { name: "Şaphane", slug: "saphane", lat: 39.0322, lng: 29.215 },
];

export type DistrictMeta = (typeof DISTRICTS)[number];

export const KUTAHYA_CENTER = { lat: 39.35, lng: 29.7, zoom: 9 };

// Mülk türleri
export const PROPERTY_TYPES = [
  { value: "daire", label: "Daire" },
  { value: "villa", label: "Villa" },
  { value: "mustakil", label: "Müstakil Ev" },
  { value: "arsa", label: "Arsa" },
  { value: "tarla", label: "Tarla / Yatırımlık Arsa" },
  { value: "isyeri", label: "İşyeri / Dükkan" },
];

export const PROPERTY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((p) => [p.value, p.label])
);

export const LISTING_STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  sold: "Satıldı",
  passive: "Pasif",
};

// Emlakçı ilanlarının yayın denetimi durumu
export const MODERATION_STATUS_LABELS: Record<string, string> = {
  pending: "Onay Bekliyor",
  approved: "Yayında",
  rejected: "Reddedildi",
};

export const AGENT_STATUS_LABELS: Record<string, string> = {
  pending: "Onay Bekliyor",
  approved: "Onaylı",
  rejected: "Reddedildi",
  suspended: "Askıda",
};

export const LEAD_TYPE_LABELS: Record<string, string> = {
  seller: "Mülk Satış Talebi",
  appointment: "Randevu Talebi",
  expertise: "Ekspertiz Talebi",
  price_offer: "Fiyat Teklifi Talebi",
  contact: "İletişim",
};

// Talep süreç aşamaları (kullanıcı + emlakçı + admin bu çizelgeyi görür)
export const LEAD_STATUS_FLOW = ["received", "reviewing", "contacted", "resolved"] as const;
export const LEAD_STATUS_LABELS: Record<string, string> = {
  received: "Alındı",
  reviewing: "İnceleniyor",
  contacted: "İletişim kuruldu",
  resolved: "Sonuçlandı",
  // Eski değerler (geriye dönük uyum)
  new: "Alındı",
  closed: "Sonuçlandı",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  view: "Görüntülenme",
  phone_click: "Telefon Tıklama",
  whatsapp_click: "WhatsApp Tıklama",
  appointment: "Randevu Talebi",
  expertise: "Ekspertiz Talebi",
  price_offer: "Fiyat Teklifi",
  seller_lead: "Satıcı Formu",
  conversion: "Dönüşüm",
};

// Google Ads odaklı SEO landing sayfaları
export const LANDING_PAGES = [
  {
    slug: "daire",
    title: "Kütahya Satılık Daire",
    propertyType: "daire",
    heading: "Kütahya Satılık Daire İlanları",
    intro:
      "Kütahya merkez ve ilçelerinde satılık daire arıyorsanız doğru yerdesiniz. Güncel portföyümüzdeki 2+1, 3+1 ve 4+1 daireleri inceleyin, hemen iletişime geçin.",
  },
  {
    slug: "arsa",
    title: "Kütahya Satılık Arsa",
    propertyType: "arsa",
    heading: "Kütahya Satılık Arsa İlanları",
    intro:
      "Kütahya'da imarlı ve imara açık satılık arsalar. Konut, ticari ve yatırım amaçlı arsa seçeneklerini portföyümüzde bulabilirsiniz.",
  },
  {
    slug: "villa",
    title: "Kütahya Satılık Villa",
    propertyType: "villa",
    heading: "Kütahya Satılık Villa İlanları",
    intro:
      "Kütahya ve çevresinde müstakil bahçeli villa ve lüks konut arayanlar için seçkin portföy. Doğayla iç içe yaşam alanlarını keşfedin.",
  },
  {
    slug: "yatirimlik-arsa",
    title: "Kütahya Yatırımlık Arsa",
    propertyType: "tarla",
    heading: "Kütahya Yatırımlık Arsa & Tarla İlanları",
    intro:
      "Kütahya'da yüksek kazanç potansiyelli yatırımlık arsa ve tarlalar. Gelişen bölgelerde değer kazanacak fırsatları kaçırmayın.",
  },
  {
    slug: "isyeri",
    title: "Kütahya Satılık İşyeri & Dükkan",
    propertyType: "isyeri",
    heading: "Kütahya Satılık İşyeri & Dükkan İlanları",
    intro:
      "Kütahya merkez ve ilçelerinde satılık dükkan, mağaza, ofis ve ticari işyeri fırsatları. Yatırımlık ve kullanıma hazır ticari gayrimenkulleri portföyümüzde inceleyin.",
  },
];

export const LANDING_BY_SLUG: Record<string, (typeof LANDING_PAGES)[number]> =
  Object.fromEntries(LANDING_PAGES.map((p) => [p.slug, p]));
