"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Expand, Images } from "lucide-react";
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
  const openAt = (i: number) => { setActive(i); setLightbox(true); };

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

  const sideThumbs = imgs.slice(1, 4);
  const extra = imgs.length - 4;

  return (
    <div>
      {/* Bento galeri */}
      <div className="grid h-[320px] grid-cols-1 gap-2 overflow-hidden rounded-xl sm:h-[420px] md:h-[500px] md:grid-cols-4 md:grid-rows-3">
        <button
          onClick={() => openAt(0)}
          className="group relative h-full w-full overflow-hidden bg-slate-100 md:col-span-3 md:row-span-3"
          aria-label="Galeriyi aç"
        >
          <Image
            src={mediaUrl(imgs[0].url)}
            alt={imgs[0].alt || title}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            priority
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Expand className="h-3.5 w-3.5" /> {imgs.length} fotoğraf
          </span>
        </button>

        {sideThumbs.map((img, i) => {
          const thumbIdx = i + 1;
          const showOverlay = i === sideThumbs.length - 1 && extra > 0;
          return (
            <button
              key={thumbIdx}
              onClick={() => openAt(thumbIdx)}
              className="group relative hidden h-full w-full overflow-hidden bg-slate-100 md:block"
              aria-label={`Fotoğraf ${thumbIdx + 1}`}
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
                  <Images className="mb-1 h-6 w-6" />
                  <span className="text-sm font-semibold">+{extra} Fotoğraf</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-brand-950/95 backdrop-blur" onClick={() => setLightbox(false)}>
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">{idx + 1} / {imgs.length}</span>
            <button onClick={() => setLightbox(false)} aria-label="Kapat" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {imgs.length > 1 && (
              <button onClick={prev} aria-label="Önceki" className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>
            )}
            <div className="relative h-full w-full max-w-5xl">
              <Image src={current.url} alt={current.alt || title} fill sizes="100vw" className="object-contain" />
            </div>
            {imgs.length > 1 && (
              <button onClick={next} aria-label="Sonraki" className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto p-4" onClick={(e) => e.stopPropagation()}>
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
