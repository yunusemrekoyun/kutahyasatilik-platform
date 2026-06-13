"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { mediaUrl, thumbUrl } from "@/lib/media";

export default function Gallery({
  images,
  title,
}: {
  images: { url: string; alt?: string | null }[];
  title: string;
}) {
  const imgs = images.length ? images : [{ url: "https://picsum.photos/seed/noimg/1200/800", alt: title }];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const idx = Math.min(active, imgs.length - 1);
  const current = imgs[idx];

  const next = useCallback(() => setActive((i) => (i + 1) % imgs.length), [imgs.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + imgs.length) % imgs.length), [imgs.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, next, prev]);

  return (
    <div>
      {/* Ana görsel */}
      <button
        onClick={() => setLightbox(true)}
        className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
      >
        <Image
          src={mediaUrl(current.url)}
          alt={current.alt || title}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition group-hover:scale-[1.02]"
          priority
        />
        <span className="absolute bottom-3 right-3 rounded-lg bg-brand-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          🔍 {idx + 1} / {imgs.length} · Büyüt
        </span>
        {imgs.length > 1 && (
          <>
            <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-brand-900 opacity-0 transition group-hover:opacity-100 hover:bg-white">‹</span>
            <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-brand-900 opacity-0 transition group-hover:opacity-100 hover:bg-white">›</span>
          </>
        )}
      </button>

      {/* Thumbnail şeridi */}
      {imgs.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition ${
                i === idx ? "ring-gold-500" : "ring-transparent hover:ring-brand-300"
              }`}
            >
              <Image src={thumbUrl(img.url)} alt={img.alt || `${title} ${i + 1}`} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-brand-950/95 backdrop-blur" onClick={() => setLightbox(false)}>
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">{idx + 1} / {imgs.length}</span>
            <button onClick={() => setLightbox(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl hover:bg-white/20">✕</button>
          </div>
          <div className="relative flex flex-1 items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {imgs.length > 1 && (
              <button onClick={prev} className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">‹</button>
            )}
            <div className="relative h-full w-full max-w-5xl">
              <Image src={current.url} alt={current.alt || title} fill sizes="100vw" className="object-contain" />
            </div>
            {imgs.length > 1 && (
              <button onClick={next} className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20">›</button>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar" onClick={(e) => e.stopPropagation()}>
              {imgs.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md ring-2 ${i === idx ? "ring-gold-500" : "ring-transparent opacity-60 hover:opacity-100"}`}>
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
