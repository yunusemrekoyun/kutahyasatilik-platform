"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Download, Link2, MessageCircle, Share2, X, Loader2 } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";

/**
 * İlan paylaşım sayfası.
 *
 * Merkezinde SUNUCUDA ÜRETİLEN paylaşım kartı var (/api/share/<slug>?v=story):
 * ilanın fotoğrafı, fiyatı, konumu ve alan adı tek görselde. Kullanıcı bunu
 * sistem paylaşım sayfasına gönderiyor, indiriyor ya da bağlantıyı kopyalıyor.
 *
 * "HİKÂYENE EKLE" WEBDE YOK — bu bir eksiklik değil, platform kısıtı:
 * Instagram'ın story paylaşımı yalnız native uygulamalara açık. iOS tarafı
 * içeriğin `com.instagram.sharedSticker.*` pano anahtarlarına yazılmasını
 * istiyor (tarayıcının Clipboard API'si uygulamaya özel tip yazamaz), Android
 * tarafı ise content:// URI'li bir intent bekliyor (web sayfası üretemez).
 * Bu yüzden webde "Story kartını paylaş" diyoruz ve kullanıcıyı sistem
 * paylaşım sayfasına götürüyoruz; Instagram'ı oradan kendisi seçiyor.
 * Mobil uygulamada gerçek "Hikâyene ekle" var.
 */
/** Yetenek değişmiyor; abonelik yalnız useSyncExternalStore sözleşmesi için. */
const subscribeNever = () => () => {};

function detectShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    const probe = new File([new Blob([""], { type: "image/png" })], "p.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export default function ShareSheet({
  slug,
  title,
  open,
  onClose,
}: {
  slug: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState<null | "share" | "download">(null);
  // Dosya paylaşımı desteği: Firefox ve uygulama içi tarayıcılar (Instagram,
  // Facebook) desteklemiyor. UA'ya bakmak güvenilmez, yeteneği yokluyoruz.
  // Sunucuda daima false; böylece hidrasyon uyuşmazlığı olmuyor ve düğme
  // yalnız gerçekten çalışacağı yerde çiziliyor.
  const canShareFiles = useSyncExternalStore(subscribeNever, detectShareFiles, () => false);

  const cardUrl = `/api/share/${slug}?v=story`;

  // Odak tuzağı + Escape: ContactButtons'taki desenin aynısı.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.getClientRects().length > 0);
      if (!focusable.length) return;
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
    };
  }, [open, onClose]);

  const fetchCard = useCallback(async () => {
    const res = await fetch(cardUrl);
    if (!res.ok) throw new Error("Kart üretilemedi");
    const blob = await res.blob();
    return new File([blob], `${slug}.png`, { type: "image/png" });
  }, [cardUrl, slug]);

  async function shareCard() {
    setBusy("share");
    try {
      const file = await fetchCard();
      // SADECE dosya gönderiliyor: yanına url/text eklendiğinde iOS ve Android
      // alıcıların çoğu görseli düşürüp yalnız metni geçiriyor. Bağlantı zaten
      // kartın içinde basılı (alan adı + ilan no).
      await navigator.share({ files: [file] });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast("Paylaşılamadı", "error");
    } finally {
      setBusy(null);
    }
  }

  async function downloadCard() {
    setBusy("download");
    try {
      const file = await fetchCard();
      const href = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = href;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(href);
      toast("Görsel indirildi");
    } catch {
      toast("Görsel indirilemedi", "error");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Bağlantı kopyalandı");
    } catch {
      toast("Kopyalanamadı", "error");
    }
  }

  function shareWhatsApp() {
    const text = `${title} - ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  if (!open) return null;

  const action =
    "flex min-h-12 items-center justify-center gap-2 rounded-control px-4 py-3 text-sm font-semibold transition disabled:opacity-60";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-control bg-paper p-5 shadow-prestige sm:rounded-control sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id="share-sheet-title" className="text-lg font-bold text-ink">
            İlanı paylaş
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Paylaşım penceresini kapat"
            className="grid h-11 w-11 shrink-0 place-items-center text-muted/70 hover:text-ink"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Kart önizlemesi: kullanıcı ne paylaşacağını görsün. */}
        <div className="mx-auto w-full max-w-[210px] overflow-hidden rounded-card border border-stone bg-canvas">
          <Image
            src={cardUrl}
            alt="Paylaşım kartı önizlemesi"
            width={1080}
            height={1920}
            unoptimized
            className="h-auto w-full"
          />
        </div>

        <div className="mt-5 grid gap-2.5">
          {canShareFiles && (
            <button type="button" onClick={shareCard} disabled={busy !== null} className={`${action} bg-brand-700 text-white hover:bg-brand-800`}>
              {busy === "share" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Share2 aria-hidden="true" className="h-4 w-4" />}
              Story kartını paylaş
            </button>
          )}
          <button type="button" onClick={downloadCard} disabled={busy !== null} className={`${action} border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100`}>
            {busy === "download" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" />}
            Görseli indir
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={shareWhatsApp} className={`${action} bg-green-600 text-white hover:bg-green-700`}>
              <MessageCircle aria-hidden="true" className="h-4 w-4" /> WhatsApp
            </button>
            <button type="button" onClick={copyLink} className={`${action} border border-stone bg-paper text-ink hover:bg-canvas`}>
              <Link2 aria-hidden="true" className="h-4 w-4" /> Bağlantı
            </button>
          </div>
        </div>

        {canShareFiles && (
          <p className="mt-3 text-center text-xs text-muted">
            Instagram hikâyesine eklemek için açılan listeden Instagram&apos;ı seçin.
          </p>
        )}
      </div>
    </div>
  );
}
