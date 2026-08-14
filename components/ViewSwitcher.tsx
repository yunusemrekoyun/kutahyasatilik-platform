"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Rows3 } from "lucide-react";

/**
 * Liste ↔ galeri görünümü. Durum URL'de tutuluyor (`?gorunum=galeri`) ki sunucuda
 * render edilebilsin, paylaşılan bağlantı aynı görünümü açsın ve geri tuşu çalışsın.
 * Varsayılan liste; parametre yokken URL kirletilmiyor.
 */
export default function ViewSwitcher() {
  const router = useRouter();
  const sp = useSearchParams();
  const view = sp.get("gorunum") === "galeri" ? "galeri" : "liste";

  function switchTo(next: "liste" | "galeri") {
    if (next === view) return;
    const params = new URLSearchParams(sp.toString());
    if (next === "liste") params.delete("gorunum");
    else params.set("gorunum", next);
    params.delete("sayfa"); // görünüm değişince başa dön
    const qs = params.toString();
    router.push(`/ilanlar${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-control transition";
  const on = "bg-brand-700 text-white";
  const off = "text-muted hover:bg-canvas hover:text-ink";

  return (
    <div
      role="group"
      aria-label="Görünüm"
      className="flex items-center gap-0.5 rounded-control border border-stone bg-paper p-0.5"
    >
      <button
        type="button"
        onClick={() => switchTo("liste")}
        aria-pressed={view === "liste"}
        aria-label="Liste görünümü"
        className={`${base} ${view === "liste" ? on : off}`}
      >
        <Rows3 aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => switchTo("galeri")}
        aria-pressed={view === "galeri"}
        aria-label="Galeri görünümü"
        className={`${base} ${view === "galeri" ? on : off}`}
      >
        <LayoutGrid aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
