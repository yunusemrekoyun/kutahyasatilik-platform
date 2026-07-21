import Link from "next/link";
import { getListings, getMapPoints } from "@/lib/listings";
import { DISTRICTS } from "@/lib/constants";
import ListingCard from "@/components/ListingCard";
import ListingsMap from "@/components/ListingsMap";
import NotFoundCTA from "@/components/NotFoundCTA";
import TrackView from "@/components/TrackView";
import { PageIntro, SectionHeading } from "@/components/ui/Editorial";

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
      <PageIntro
        eyebrow="Kütahya portföyü"
        title={heading}
        intro={intro}
        actions={<><Link href="#ilanlar" className="rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">İlanları gör ({listings.length})</Link><Link href="/satici" className="rounded-lg border border-brand-200 bg-paper px-5 py-3 font-semibold text-brand-800 hover:bg-brand-50">Mülkümü sat</Link></>}
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* İlçe linkleri */}
        <div className="mb-10 flex flex-wrap gap-x-5 gap-y-3 border-y border-stone py-5">
          {DISTRICTS.slice(0, 6).map((d) => (
            <Link
              key={d.slug}
              href={`/ilanlar?ilce=${encodeURIComponent(d.name)}`}
              className="text-sm font-semibold text-muted hover:text-brand-800"
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
            <div className="rounded-lg bg-paper p-10 text-center ring-1 ring-stone">
              <p className="text-slate-600">Bu kategoride şu an aktif ilan bulunmuyor. Aşağıdan bizimle iletişime geçin, size uygun seçenekleri sunalım.</p>
            </div>
          )}
        </section>

        {points.length > 0 && (
          <section className="mt-16 border-t border-stone pt-10">
            <SectionHeading eyebrow="Konum" title="Harita üzerinde" description="İlanları ilçeleri ve çevreleriyle birlikte inceleyin." />
            <div className="mt-6 overflow-hidden border border-stone">
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
