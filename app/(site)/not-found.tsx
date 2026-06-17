import Link from "next/link";
import NotFoundCTA from "@/components/NotFoundCTA";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="font-display text-6xl font-bold text-brand-700 tabular-nums">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-slate-900">Sayfa veya ilan bulunamadı</h1>
      <p className="mt-2 text-slate-600">
        Aradığınız ilan satılmış veya yayından kaldırılmış olabilir.
      </p>
      <Link href="/ilanlar" className="mt-6 inline-block rounded-[10px] bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-800">
        Tüm İlanları Gör
      </Link>
      <div className="mt-12 text-left">
        <NotFoundCTA />
      </div>
    </div>
  );
}
