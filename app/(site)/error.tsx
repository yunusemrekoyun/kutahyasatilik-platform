"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold text-brand-900">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-slate-600">Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse bizimle iletişime geçin.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => reset()} className="rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-800">
          Tekrar Dene
        </button>
        <Link href="/" className="rounded-lg px-5 py-2.5 font-medium text-slate-600 transition hover:bg-slate-100">
          Ana Sayfa
        </Link>
      </div>
    </div>
  );
}
