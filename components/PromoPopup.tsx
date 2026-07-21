"use client";

import { useEffect, useState } from "react";
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

export default function PromoPopup({ popup }: { popup: PromoData }) {
  const [open, setOpen] = useState(false);

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
    const t = setTimeout(() => setOpen(true), Math.max(0, popup.delaySec) * 1000);
    return () => clearTimeout(t);
  }, [popup]);

  function dismiss() {
    setOpen(false);
    const key = `kspop_${popup.id}`;
    try {
      if (popup.frequency === "session") sessionStorage.setItem(key, "1");
      else if (popup.frequency === "daily") localStorage.setItem(key, todayKey());
    } catch {
      /* yoksay */
    }
  }

  if (!open) return null;

  const internal = popup.linkUrl?.startsWith("/");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg bg-paper shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.imageUrl && (
          <div className="relative aspect-[16/9] w-full bg-slate-100">
            <Image src={popup.imageUrl} alt={popup.title} fill sizes="(max-width:768px) 100vw, 448px" className="object-cover" />
          </div>
        )}

        <div className="p-6 text-center">
          <h3 className="font-display text-xl font-bold text-brand-900">{popup.title}</h3>
          {popup.body && <p className="mt-2 text-sm leading-relaxed text-slate-600">{popup.body}</p>}

          {popup.linkUrl && popup.linkText && (
            internal ? (
              <Link
                href={popup.linkUrl}
                onClick={dismiss}
                className="mt-5 inline-block rounded-lg bg-brand-800 px-6 py-3 font-bold text-white transition hover:bg-brand-900"
              >
                {popup.linkText}
              </Link>
            ) : (
              <a
                href={popup.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="mt-5 inline-block rounded-lg bg-brand-800 px-6 py-3 font-bold text-white transition hover:bg-brand-900"
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
