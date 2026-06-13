"use client";

import { useState } from "react";
import { Phone, MessageCircle, CalendarDays, ClipboardCheck, Banknote, X } from "lucide-react";
import { SITE, telLink, whatsappLink } from "@/lib/site";
import { trackConversion } from "@/lib/track";
import LeadForm from "./LeadForm";

type ModalType = "appointment" | "expertise" | "price_offer" | null;

export default function ContactButtons({
  listingId,
  listingTitle,
  district,
  layout = "grid",
}: {
  listingId: string;
  listingTitle: string;
  district?: string;
  layout?: "grid" | "stack";
}) {
  const [modal, setModal] = useState<ModalType>(null);

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
        <a
          href={telLink()}
          onClick={() => trackConversion({ type: "phone_click", listingId, district })}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3.5 font-bold text-white hover:bg-brand-800 transition shadow-sm"
        >
          <Phone className="h-5 w-5" /> Telefon ile Ara
        </a>
        <a
          href={whatsappLink(waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackConversion({ type: "whatsapp_click", listingId, district })}
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 font-bold text-white hover:bg-green-700 transition shadow-sm"
        >
          <MessageCircle className="h-5 w-5" /> WhatsApp&apos;tan Yaz
        </a>
        <button
          onClick={() => setModal("appointment")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 transition"
        >
          <CalendarDays className="h-4 w-4" /> Randevu Talep Et
        </button>
        <button
          onClick={() => setModal("expertise")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 transition"
        >
          <ClipboardCheck className="h-4 w-4" /> Ekspertiz İste
        </button>
        <button
          onClick={() => setModal("price_offer")}
          className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-gold-400 bg-gold-50 px-3 py-3 text-sm font-bold text-gold-600 hover:bg-amber-100 transition"
          style={{ backgroundColor: "#fffbeb" }}
        >
          <Banknote className="h-4 w-4" /> Fiyat Teklifi Al
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Hemen arayın: <a href={telLink()} className="font-semibold text-brand-700">{SITE.phone}</a>
      </p>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">
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
            />
          </div>
        </div>
      )}
    </>
  );
}
