"use client";

import { useState } from "react";
import { MessageCircle, Link2, Share2 } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import ShareSheet from "@/components/ShareSheet";

export default function ShareButtons({ title, slug }: { title: string; slug?: string }) {
  const { toast } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  // URL'i render'da değil, tıklama anında okuyoruz → hydration mismatch yok
  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${title} - ${window.location.href}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Bağlantı kopyalandı");
    } catch {
      toast("Kopyalanamadı", "error");
    }
  }

  // Slug varsa kart önizlemeli paylaşım sayfası açılıyor; yoksa (eski çağrı
  // yerleri) eski davranış korunuyor.
  async function nativeShare() {
    if (slug) {
      setSheetOpen(true);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        /* iptal */
      }
    } else {
      await copy();
    }
  }

  const btn = "grid h-11 w-11 place-items-center rounded-full bg-canvas text-muted hover:bg-stone";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted">Paylaş:</span>
      <button type="button" onClick={shareWhatsApp} aria-label="WhatsApp'ta paylaş" title="WhatsApp" className="grid h-11 w-11 place-items-center rounded-full bg-green-100 text-green-700 hover:bg-green-200">
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
      </button>
      <button type="button" onClick={copy} aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala" className={btn}><Link2 aria-hidden="true" className="h-4 w-4" /></button>
      <button type="button" onClick={nativeShare} aria-label="Paylaş" title="Paylaş" className={btn}><Share2 aria-hidden="true" className="h-4 w-4" /></button>
      {slug && <ShareSheet slug={slug} title={title} open={sheetOpen} onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
