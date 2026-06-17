"use client";

import { Phone, MessageCircle } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";
import { trackConversion } from "@/lib/track";

export default function MobileContactBar({
  listingId,
  listingTitle,
  district,
}: {
  listingId: string;
  listingTitle: string;
  district?: string;
}) {
  const wa = `Merhaba, "${listingTitle}" ilanı hakkında bilgi almak istiyorum.`;
  return (
    <div className="fixed inset-x-0 bottom-14 z-30 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white/95 p-2.5 backdrop-blur lg:hidden">
      <a
        href={telLink()}
        onClick={() => trackConversion({ type: "phone_click", listingId, district })}
        className="flex items-center justify-center gap-2 rounded-[10px] bg-brand-700 py-3.5 text-sm font-semibold text-white"
      >
        <Phone className="h-4 w-4" /> Ara
      </a>
      <a
        href={whatsappLink(wa)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackConversion({ type: "whatsapp_click", listingId, district })}
        className="flex items-center justify-center gap-2 rounded-[10px] bg-green-600 py-3.5 text-sm font-semibold text-white"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
    </div>
  );
}
