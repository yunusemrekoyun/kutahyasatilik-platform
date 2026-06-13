import Link from "next/link";
import NotFoundCTA from "@/components/NotFoundCTA";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-6xl font-black text-brand-700">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Sayfa veya ilan bulunamadı</h1>
      <p className="mt-2 text-slate-600">
        Aradığınız ilan satılmış veya yayından kaldırılmış olabilir.
      </p>
      <Link href="/ilanlar" className="mt-6 inline-block rounded-xl bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">
        Tüm İlanları Gör
      </Link>
      <div className="mt-12 text-left">
        <NotFoundCTA />
      </div>
    </div>
  );
}
