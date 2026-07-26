"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Expand, Images } from "lucide-react";
import { publicImageUrl, thumbUrl } from "@/lib/media";

export default function Gallery({
  images,
  title,
}: {
  images: { url: string; alt?: string | null }[];
  title: string;
}) {
  const safeImages = images.flatMap((image) => {
    const url = publicImageUrl(image.url);
    return url ? [{ ...image, url }] : [];
  });
  const imgs = safeImages.length ? safeImages : [{ url: "/placeholder-listing.webp", alt: title }];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const idx = Math.min(active, imgs.length - 1);
  const current = imgs[idx];

  const next = useCallback(() => setActive((i) => (i + 1) % imgs.length), [imgs.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + imgs.length) % imgs.length), [imgs.length]);
  const openAt = (i: number) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActive(i);
    setLightbox(true);
  };
  const closeLightbox = useCallback(() => setLightbox(false), []);

  useEffect(() => {
    if (!lightbox) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          )
        ).filter((element) => element.getClientRects().length > 0);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [closeLightbox, lightbox, next, prev]);

  const sideThumbs = imgs.slice(1, 4);
  const extra = imgs.length - 4;

  return (
    <div>
      {/* Mobil: kaydırmalı galeri — TÜM fotoğraflar parmakla gezilir, kırpılmadan (contain) gösterilir */}
      <div role="region" aria-label={`${title} fotoğraf galerisi`} className="relative overflow-hidden rounded-xl ring-1 ring-slate-200 md:hidden">
        <div
          className="no-scrollbar flex h-[340px] snap-x snap-mandatory overflow-x-auto bg-brand-950"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.min(Math.round(el.scrollLeft / el.clientWidth), imgs.length - 1);
            if (i !== idx && i >= 0) setActive(i);
          }}
        >
          {imgs.map((img, i) => (
            <button
              type="button"
              key={i}
              onClick={() => openAt(i)}
              className="relative h-full w-full shrink-0 snap-center"
              aria-label={`${i + 1}. fotoğrafı büyüt`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${title} ${i + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority={i === 0}
              />
            </button>
          ))}
        </div>
        <span aria-live="polite" aria-atomic="true" className="pointer-events-none absolute right-3 top-3 rounded-lg bg-brand-950/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {idx + 1} / {imgs.length}
        </span>
        {imgs.length > 1 && (
          <div aria-hidden="true" className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {imgs.slice(0, 8).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === Math.min(idx, 7) ? "w-4 bg-paper" : "w-1.5 bg-paper/60"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Masaüstü: bento galeri */}
      <div className="hidden gap-1.5 overflow-hidden rounded-2xl ring-1 ring-slate-200 md:grid md:h-[540px] md:grid-cols-4 md:grid-rows-3">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative h-full w-full overflow-hidden bg-slate-100 md:col-span-3 md:row-span-3"
          aria-label={`${title} fotoğraf galerisini aç`}
        >
          <Image
            src={imgs[0].url}
            alt={imgs[0].alt || title}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            priority
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Expand aria-hidden="true" className="h-3.5 w-3.5" /> {imgs.length} fotoğraf
          </span>
        </button>

        {sideThumbs.map((img, i) => {
          const thumbIdx = i + 1;
          const showOverlay = i === sideThumbs.length - 1 && extra > 0;
          return (
            <button
              type="button"
              key={thumbIdx}
              onClick={() => openAt(thumbIdx)}
              className="group relative hidden h-full w-full overflow-hidden bg-slate-100 md:block"
              aria-label={`${thumbIdx + 1}. fotoğrafı aç`}
            >
              <Image
                src={thumbUrl(img.url)}
                alt={img.alt || `${title} ${thumbIdx + 1}`}
                fill
                sizes="25vw"
                className="object-cover transition group-hover:opacity-90"
              />
              {showOverlay && (
                <span className="absolute inset-0 flex flex-col items-center justify-center bg-brand-950/60 text-white">
                  <Images aria-hidden="true" className="mb-1 h-6 w-6" />
                  <span className="text-sm font-semibold">+{extra} Fotoğraf</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-gallery-title"
          className="fixed inset-0 z-[90] flex flex-col bg-brand-950/95 backdrop-blur"
          onClick={closeLightbox}
        >
          <h2 id="listing-gallery-title" className="sr-only">{title} fotoğraf galerisi</h2>
          <div className="flex items-center justify-between p-4 text-white">
            <span aria-live="polite" aria-atomic="true" className="text-sm font-medium">{idx + 1} / {imgs.length}</span>
            <button ref={closeButtonRef} type="button" onClick={closeLightbox} aria-label="Fotoğraf galerisini kapat" className="grid h-11 w-11 place-items-center rounded-full bg-paper/10 hover:bg-paper/20"><X aria-hidden="true" className="h-5 w-5" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {imgs.length > 1 && (
              <button type="button" onClick={prev} aria-label="Önceki fotoğraf" className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-paper/10 text-white hover:bg-paper/20"><ChevronLeft aria-hidden="true" className="h-6 w-6" /></button>
            )}
            <div className="relative h-full w-full max-w-5xl">
              <Image src={current.url} alt={current.alt || `${title}, ${idx + 1}. fotoğraf`} fill sizes="100vw" className="object-contain" />
            </div>
            {imgs.length > 1 && (
              <button type="button" onClick={next} aria-label="Sonraki fotoğraf" className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-paper/10 text-white hover:bg-paper/20"><ChevronRight aria-hidden="true" className="h-6 w-6" /></button>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto p-4" onClick={(e) => e.stopPropagation()}>
              {imgs.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`${i + 1}. fotoğrafı göster`}
                  aria-current={i === idx ? "true" : undefined}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md ring-2 ${i === idx ? "ring-gold-500" : "ring-transparent opacity-60 hover:opacity-100"}`}
                >
                  <Image src={thumbUrl(img.url)} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
