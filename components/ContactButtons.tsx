"use client";

import { useState } from "react";
import { Phone, MessageCircle, CalendarDays, ClipboardCheck, Banknote, X } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";
import { useSiteContact } from "./SiteContactProvider";
import { trackConversion } from "@/lib/track";
import LeadForm from "./LeadForm";

type ModalType = "appointment" | "expertise" | "price_offer" | null;

export default function ContactButtons({
  listingId,
  listingTitle,
  district,
  layout = "grid",
  isLoggedIn = true,
  defaultName = "",
}: {
  listingId: string;
  listingTitle: string;
  district?: string;
  layout?: "grid" | "stack";
  isLoggedIn?: boolean;
  defaultName?: string;
}) {
  const [modal, setModal] = useState<ModalType>(null);
  const c = useSiteContact();

  const waMessage = `Merhaba, "${listingTitle}" ilanı (kutahyasatilik.com) hakkında bilgi almak istiyorum.`;

  return (
    <>
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-2 gap-2.5"
            : "flex flex-col gap-2.5"
        }
      >
        {c.phoneRaw && (
          <a
            href={telLink(c.phoneRaw)}
            onClick={() => trackConversion({ type: "phone_click", listingId, district })}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand-700 px-4 py-3.5 font-semibold text-white transition hover:bg-brand-800"
          >
            <Phone className="h-5 w-5" /> Telefon ile Ara
          </a>
        )}
        {c.whatsapp && (
          <a
            href={whatsappLink(c.whatsapp, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConversion({ type: "whatsapp_click", listingId, district })}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[10px] bg-green-600 px-4 py-3.5 font-semibold text-white transition hover:bg-green-700"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp&apos;tan Yaz
          </a>
        )}
        <button
          onClick={() => setModal("appointment")}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-brand-200 bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          <CalendarDays className="h-4 w-4" /> Randevu Talep Et
        </button>
        <button
          onClick={() => setModal("expertise")}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-brand-200 bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          <ClipboardCheck className="h-4 w-4" /> Ekspertiz İste
        </button>
        <button
          onClick={() => setModal("price_offer")}
          className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-gold-300 bg-gold-50 px-3 py-3 text-sm font-semibold text-gold-700 transition hover:bg-gold-100"
        >
          <Banknote className="h-4 w-4" /> Fiyat Teklifi Al
        </button>
      </div>

      {c.phone && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Hemen arayın: <a href={telLink(c.phoneRaw)} className="font-semibold text-brand-700">{c.phone}</a>
        </p>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-paper p-6 shadow-prestige"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {modal === "appointment" ? "Randevu Talep Et" : modal === "expertise" ? "Ücretsiz Ekspertiz İste" : "Fiyat Teklifi Al"}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700" aria-label="Kapat"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">İlan: {listingTitle}</p>
            <LeadForm
              type={modal}
              listingId={listingId}
              listingTitle={listingTitle}
              district={district}
              compact
              isLoggedIn={isLoggedIn}
              defaultName={defaultName}
            />
          </div>
        </div>
      )}
    </>
  );
}
