"use client";

import { AlertTriangle } from "lucide-react";
import { adminCard, adminBtnPrimary, adminBtnGhost } from "@/components/admin/ui";

// Panel hata sınırı. Bunsuz her server action throw'u global-error.tsx'e düşüyor,
// admin kabuğu (nav + sayaçlar) tamamen kayboluyor ve formdaki veri gidiyordu.
// saveListing gibi action'lar doğrulama hatasını throw ile bildiriyor — yani bu
// NORMAL yol, istisna değil.
//
// Sınır: production'da Next server hatalarının mesajını istemciden gizler, burada
// yalnız genel metin + digest görünür. Doğrulama mesajının kullanıcıya ulaşması için
// action'ların throw yerine state döndürmesi gerekiyor (Faz 6).
//
// Sentry'ye raporlamıyoruz: doğrulama hataları normal akış, gürültü yapar.
// Hata görünürlüğü ayrı ele alınıyor (Faz 10.2).
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={`${adminCard} mx-auto max-w-lg p-8 text-center`}>
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-control bg-amber-50 text-amber-600 ring-1 ring-amber-200">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">İşlem tamamlanamadı</h1>
      <p className="mt-2 text-sm text-muted">
        Kaydetme sırasında bir hata oluştu. Girdiğiniz bilgileri kontrol edip tekrar deneyin.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted/70">Hata kodu: {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className={adminBtnPrimary}>
          Tekrar dene
        </button>
        <a href="/admin" className={adminBtnGhost}>
          Panele dön
        </a>
      </div>
    </div>
  );
}
