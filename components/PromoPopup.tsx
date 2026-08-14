"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export type PromoData = {
  id: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  frequency: string;
  delaySec: number;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function rememberDismissal(popup: PromoData) {
  const key = `kspop_${popup.id}`;
  try {
    if (popup.frequency === "session") sessionStorage.setItem(key, "1");
    else if (popup.frequency === "daily") localStorage.setItem(key, todayKey());
  } catch {
    /* storage yoksa yalnız bu görünüm için kapat */
  }
}

export default function PromoPopup({ popup }: { popup: PromoData }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const key = `kspop_${popup.id}`;
    let allowed = true;
    try {
      if (popup.frequency === "session") {
        allowed = sessionStorage.getItem(key) !== "1";
      } else if (popup.frequency === "daily") {
        allowed = localStorage.getItem(key) !== todayKey();
      }
    } catch {
      /* storage yoksa göster */
    }
    if (!allowed) return;
    const t = setTimeout(() => {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    }, Math.max(0, popup.delaySec) * 1000);
    return () => clearTimeout(t);
  }, [popup]);

  useEffect(() => {
    if (!open) return;
    const returnFocus = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        rememberDismissal(popup);
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      returnFocus?.focus();
    };
  }, [open, popup]);

  function dismiss() {
    setOpen(false);
    rememberDismissal(popup);
  }

  if (!open) return null;

  const internal = popup.linkUrl?.startsWith("/");

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        aria-describedby={popup.body ? "promo-popup-description" : undefined}
        className="relative w-full max-w-md overflow-hidden rounded-control bg-paper shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="Duyuruyu kapat"
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        {popup.imageUrl && (
          <div className="relative aspect-[16/9] w-full bg-canvas">
            <Image src={popup.imageUrl} alt={popup.title} fill sizes="(max-width:768px) 100vw, 448px" className="object-cover" />
          </div>
        )}

        <div className="p-6 text-center">
          <h3 id="promo-popup-title" className="text-xl font-bold text-brand-900">{popup.title}</h3>
          {popup.body && <p id="promo-popup-description" className="mt-2 text-sm leading-relaxed text-muted">{popup.body}</p>}

          {popup.linkUrl && popup.linkText && (
            internal ? (
              <Link
                href={popup.linkUrl}
                onClick={dismiss}
                className="mt-5 inline-flex min-h-11 items-center rounded-control bg-brand-800 px-6 py-3 font-bold text-white transition hover:bg-brand-900"
              >
                {popup.linkText}
              </Link>
            ) : (
              <a
                href={popup.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="mt-5 inline-flex min-h-11 items-center rounded-control bg-brand-800 px-6 py-3 font-bold text-white transition hover:bg-brand-900"
              >
                {popup.linkText}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
