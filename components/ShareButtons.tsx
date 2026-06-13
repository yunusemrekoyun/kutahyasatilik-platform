"use client";

import { MessageCircle, Link2, Share2 } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";

export default function ShareButtons({ title }: { title: string }) {
  const { toast } = useStore();

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

  async function nativeShare() {
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

  const btn = "grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Paylaş:</span>
      <button onClick={shareWhatsApp} aria-label="WhatsApp'ta paylaş" title="WhatsApp" className="grid h-8 w-8 place-items-center rounded-full bg-green-100 text-green-700 hover:bg-green-200">
        <MessageCircle className="h-4 w-4" />
      </button>
      <button onClick={copy} aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala" className={btn}><Link2 className="h-4 w-4" /></button>
      <button onClick={nativeShare} aria-label="Paylaş" title="Paylaş" className={btn}><Share2 className="h-4 w-4" /></button>
    </div>
  );
}
