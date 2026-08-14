"use client";

import { Phone, MessageCircle, CalendarDays, MessageSquare } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";
import { useSiteContact } from "./SiteContactProvider";
import { trackConversion } from "@/lib/track";

export default function MobileContactBar({
  listingId,
  listingTitle,
  district,
  category,
  hasOwnSeller = false,
}: {
  listingId: string;
  listingTitle: string;
  district?: string;
  /** İlanın kategorisi. Verilmezse emlak varsayılır (eski çağrı yerleri). */
  category?: string;
  /**
   * İlanın kendi satıcısı (danışman veya bireysel sahip) var mı.
   * Varsa sitenin genel numarası GÖSTERİLMEZ: bireysel ilanda satıcının
   * telefonu "Göster" perdesinin arkasında, çubuk onu by-pass etmemeli.
   */
  hasOwnSeller?: boolean;
}) {
  const c = useSiteContact();
  const isRealEstate = !category || category === "emlak";
  const wa = `Merhaba, "${listingTitle}" ilanı hakkında bilgi almak istiyorum.`;
  const showSitePhone = !hasOwnSeller;
  // Her zaman görünür: birincil eylem forma/talep alanına götürür (#ilan-iletisim).
  // Telefon/WhatsApp yalnız tanımlıysa kompakt ikon olarak eklenir (sahte link yok).
  return (
    <div role="region" aria-label="İlan iletişim seçenekleri" className="fixed inset-x-0 bottom-[58px] z-30 flex gap-2 border-t border-stone bg-paper/95 p-2.5 backdrop-blur lg:hidden">
      <a
        href="#ilan-iletisim"
        className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-brand-700 py-3.5 text-sm font-semibold text-white"
      >
        {isRealEstate ? (
          <><CalendarDays aria-hidden="true" className="h-4 w-4" /> Randevu / Bilgi Al</>
        ) : (
          <><MessageSquare aria-hidden="true" className="h-4 w-4" /> Satıcıya Ulaş</>
        )}
      </a>
      {showSitePhone && c.phoneRaw && (
        <a
          href={telLink(c.phoneRaw)}
          onClick={() => trackConversion({ type: "phone_click", listingId, district })}
          aria-label="Telefon ile ara"
          className="grid w-12 shrink-0 place-items-center rounded-[10px] bg-brand-50 text-brand-700"
        >
          <Phone aria-hidden="true" className="h-5 w-5" />
        </a>
      )}
      {showSitePhone && c.whatsapp && (
        <a
          href={whatsappLink(c.whatsapp, wa)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackConversion({ type: "whatsapp_click", listingId, district })}
          aria-label="WhatsApp'tan yaz"
          className="grid w-12 shrink-0 place-items-center rounded-[10px] bg-green-600 text-white"
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
