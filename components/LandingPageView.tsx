import Link from "next/link";
import { getListings, getMapPoints } from "@/lib/listings";
import { DISTRICTS } from "@/lib/constants";
import ListingCard from "@/components/ListingCard";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";

export default async function LandingPageView({
  propertyType,
  heading,
  intro,
}: {
  propertyType: string;
  heading: string;
  intro: string;
}) {
  const [listings, points] = await Promise.all([
    getListings({ propertyType }, 30),
    getMapPoints({ propertyType }),
  ]);

  return (
    <div>
      <TrackView />
      {/* HERO */}
      <section className="bg-gradient-to-br from-brand-800 to-brand-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h1 className="text-3xl sm:text-4xl font-black">{heading}</h1>
          <p className="mt-4 max-w-3xl text-brand-100">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#ilanlar" className="rounded-xl bg-gold-500 px-5 py-3 font-bold text-slate-900 hover:bg-gold-400">
              İlanları Gör ({listings.length})
            </Link>
            <Link href="/satici" className="rounded-xl bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">
              Mülkümü Sat
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* İlçe linkleri */}
        <div className="mb-8 flex flex-wrap gap-2">
          {DISTRICTS.slice(0, 6).map((d) => (
            <Link
              key={d.slug}
              href={`/ilanlar?ilce=${encodeURIComponent(d.name)}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"
            >
              {d.name}
            </Link>
          ))}
        </div>

        <section id="ilanlar">
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((l) => (
                <ListingCard key={l.slug} listing={l} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
              <p className="text-slate-600">Bu kategoride şu an aktif ilan bulunmuyor. Aşağıdan bizimle iletişime geçin, size uygun seçenekleri sunalım.</p>
            </div>
          )}
        </section>

        {points.length > 0 && (
          <section className="mt-12 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="text-2xl font-extrabold text-slate-900">Harita Üzerinde</h2>
            <div className="mt-5">
              <ListingsMap points={points} height="420px" />
            </div>
          </section>
        )}

        <section className="mt-14">
          <NotFoundCTA />
        </section>
      </div>
    </div>
  );
}
