"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { telLink } from "@/lib/site";
import { trackConversion } from "@/lib/track";
import { btnPrimary } from "@/components/ui/ui";

/**
 * Bireysel satıcının telefonu — tıklamayla açılır.
 *
 * Numara sunucudan geliyor ama ilk boyamada gizli: ilan sayfaları herkese açık ve
 * ISR ile cache'li olduğu için numarayı düz metin olarak basmak, sayfayı tarayan
 * botlara hazır bir telefon listesi vermek demek. Tek tıklık perde bunu kırıyor.
 *
 * Kurumsal ilanlarda bu bileşen kullanılmaz — orada ContactButtons/site numarası var.
 */
export default function SellerPhone({
  phone,
  listingId,
  district,
}: {
  phone: string;
  listingId: string;
  district: string;
}) {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => {
          setShown(true);
          trackConversion({ type: "phone_click", listingId, district });
        }}
        className={`${btnPrimary} w-full`}
      >
        <Phone aria-hidden="true" className="h-4 w-4" />
        Telefonu Göster
      </button>
    );
  }

  const href = telLink(phone);
  return (
    <a href={href} className={`${btnPrimary} w-full`}>
      <Phone aria-hidden="true" className="h-4 w-4" />
      {phone}
    </a>
  );
}
