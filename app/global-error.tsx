"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="tr">
      <body className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <main>
          <h1 className="text-2xl font-bold text-slate-900">Beklenmeyen bir hata oluştu</h1>
          <p className="mt-2 text-slate-600">Sayfayı yeniden yükleyerek tekrar deneyebilirsiniz.</p>
          <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-lg bg-brand-700 px-5 font-semibold text-white">Tekrar dene</button>
        </main>
      </body>
    </html>
  );
}
