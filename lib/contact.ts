import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";

// Sitenin iletişim bilgilerinin TEK kaynağı.
// Öncelik: admin > Ayarlar (Setting tablosu) → yoksa lib/site.ts env varsayılanı.
// Sahte numara yok: hiçbiri yoksa telefon/WhatsApp boş kalır ve butonlar gizlenir.
export type SiteContact = {
  phone: string; // görünen (ör. +90 5xx ...)
  phoneRaw: string; // tel: linki için (sadece rakam/+)
  whatsapp: string; // wa.me için (sadece rakam)
  email: string;
  address: string;
};

// SUNUCU tarafı (server component / route handler) için. İstemci tarafı:
// SiteContactProvider + useSiteContact() (bkz. components/SiteContactProvider.tsx).
export async function getSiteContact(): Promise<SiteContact> {
  const s: Record<string, string> = {};
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["phone", "whatsapp", "email", "address"] } },
    });
    for (const r of rows) if (r.value) s[r.key] = r.value;
  } catch {
    /* veritabanı hazır değilse env varsayılanı kullanılır */
  }
  const phone = s.phone || SITE.phone || "";
  return {
    phone,
    phoneRaw: phone.replace(/[^\d+]/g, ""),
    whatsapp: (s.whatsapp || SITE.whatsapp || "").replace(/[^\d]/g, ""),
    email: s.email || SITE.email || "",
    address: s.address || SITE.address || "",
  };
}
