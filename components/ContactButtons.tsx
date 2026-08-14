"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle, CalendarDays, ClipboardCheck, Banknote, X } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/site";
import { useSiteContact } from "./SiteContactProvider";
import { trackConversion } from "@/lib/track";
import { useSessionUser } from "@/lib/useSessionUser";
import LeadForm from "./LeadForm";

type ModalType = "appointment" | "expertise" | "price_offer" | "contact";

const MODAL_TITLE: Record<ModalType, string> = {
  appointment: "Randevu Talep Et",
  expertise: "Ücretsiz Ekspertiz İste",
  price_offer: "Fiyat Teklifi Al",
  contact: "Bilgi İste",
};

/**
 * İlan formu eylemleri kategoriye göre değişir.
 *
 * "Ekspertiz" ve "yerinde randevu" emlak akışının kavramları; bir traktör ya da
 * telefon ilanında anlamsız. Site her tür satılık ilana açıldığında bu düğmeler
 * kategori bakılmadan çizilmeye devam ediyordu — emlak dışı ilanlarda emlak
 * arayüzü görünüyordu.
 */
function actionsFor(category: string | undefined): { type: Exclude<ModalType, "contact"> | "contact"; label: string; tone: "soft" | "gold"; wide?: boolean }[] {
  if (!category || category === "emlak") {
    return [
      { type: "appointment", label: "Randevu Talep Et", tone: "soft" },
      { type: "expertise", label: "Ekspertiz İste", tone: "soft" },
      { type: "price_offer", label: "Fiyat Teklifi Al", tone: "gold", wide: true },
    ];
  }
  return [
    { type: "contact", label: "Bilgi İste", tone: "soft" },
    { type: "price_offer", label: "Fiyat Teklifi Al", tone: "gold" },
  ];
}

export default function ContactButtons({
  listingId,
  listingTitle,
  district,
  category,
  layout = "grid",
}: {
  listingId: string;
  listingTitle: string;
  district?: string;
  /** İlanın kategorisi. Verilmezse emlak varsayılır (eski çağrı yerleri). */
  category?: string;
  layout?: "grid" | "stack";
}) {
  // Oturumu burada da çağırıyoruz: bileşen sayfa yüklenirken mount olduğu için
  // istek modal açılmadan tamamlanır, LeadForm cache'e hazır bulur.
  useSessionUser();
  const [modal, setModal] = useState<ModalType | null>(null);
  const c = useSiteContact();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const waMessage = `Merhaba, "${listingTitle}" ilanı (kutahyasatilik.com) hakkında bilgi almak istiyorum.`;
  const actions = actionsFor(category);
  const modalTitle = modal ? MODAL_TITLE[modal] : "";

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
        {actions.map((action) => {
          const Icon =
            action.type === "appointment"
              ? CalendarDays
              : action.type === "expertise"
              ? ClipboardCheck
              : action.type === "price_offer"
              ? Banknote
              : MessageCircle;
          return (
            <button
              key={action.type}
              type="button"
              onClick={(event) => { returnFocusRef.current = event.currentTarget; setModal(action.type); }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-3 text-sm font-semibold transition ${
                action.wide ? "col-span-2 " : ""
              }${
                action.tone === "gold"
                  ? "border-gold-300 bg-gold-50 text-gold-700 hover:bg-gold-100"
                  : "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" /> {action.label}
            </button>
          );
        })}
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
