"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle, CalendarDays, ClipboardCheck, Banknote, X } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";
import { useSiteContact } from "./SiteContactProvider";
import { trackConversion } from "@/lib/track";
import { useSessionUser } from "@/lib/useSessionUser";
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
  // Oturumu burada da çağırıyoruz: bileşen sayfa yüklenirken mount olduğu için
  // istek modal açılmadan tamamlanır, LeadForm cache'e hazır bulur.
  useSessionUser();
  const [modal, setModal] = useState<ModalType>(null);
  const c = useSiteContact();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const waMessage = `Merhaba, "${listingTitle}" ilanı (kutahyasatilik.com) hakkında bilgi almak istiyorum.`;
  const modalTitle = modal === "appointment" ? "Randevu Talep Et" : modal === "expertise" ? "Ücretsiz Ekspertiz İste" : "Fiyat Teklifi Al";

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setModal(null);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [modal]);

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
            <Phone aria-hidden="true" className="h-5 w-5" /> Telefon ile Ara
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
            <MessageCircle aria-hidden="true" className="h-5 w-5" /> WhatsApp&apos;tan Yaz
          </a>
        )}
        <button
          type="button"
          onClick={(event) => { returnFocusRef.current = event.currentTarget; setModal("appointment"); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-brand-200 bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          <CalendarDays aria-hidden="true" className="h-4 w-4" /> Randevu Talep Et
        </button>
        <button
          type="button"
          onClick={(event) => { returnFocusRef.current = event.currentTarget; setModal("expertise"); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-brand-200 bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          <ClipboardCheck aria-hidden="true" className="h-4 w-4" /> Ekspertiz İste
        </button>
        <button
          type="button"
          onClick={(event) => { returnFocusRef.current = event.currentTarget; setModal("price_offer"); }}
          className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-gold-300 bg-gold-50 px-3 py-3 text-sm font-semibold text-gold-700 transition hover:bg-gold-100"
        >
          <Banknote aria-hidden="true" className="h-4 w-4" /> Fiyat Teklifi Al
        </button>
      </div>

      {c.phone && (
        <p className="mt-3 text-center text-xs text-muted">
          Hemen arayın: <a href={telLink(c.phoneRaw)} className="font-semibold text-brand-700">{c.phone}</a>
        </p>
      )}

      {modal && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-contact-dialog-title"
            aria-describedby="listing-contact-dialog-description"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-control bg-paper p-6 shadow-prestige"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between">
              <h3 id="listing-contact-dialog-title" className="text-lg font-bold text-ink">
                {modalTitle}
              </h3>
              <button ref={closeButtonRef} type="button" onClick={() => setModal(null)} className="grid h-11 w-11 shrink-0 place-items-center text-muted/70 hover:text-ink" aria-label={`${modalTitle} penceresini kapat`}><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>
            <p id="listing-contact-dialog-description" className="mb-4 text-xs text-muted">İlan: {listingTitle}</p>
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
