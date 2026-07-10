import Link from "next/link";

// Kök 404 — (site) grubu DIŞINDA kalan eşleşmeyen URL'ler için (Next varsayılan
// İngilizce sayfası yerine). Site grubu içindeki notFound() çağrıları
// app/(site)/not-found.tsx'i kullanmaya devam eder.
export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl font-bold text-brand-700 tabular-nums">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-slate-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-slate-600">
          Aradığınız sayfa taşınmış veya kaldırılmış olabilir.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-[10px] bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-800"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/ilanlar"
            className="rounded-[10px] border border-brand-200 bg-white px-6 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Tüm İlanlar
          </Link>
        </div>
      </div>
    </main>
  );
}
