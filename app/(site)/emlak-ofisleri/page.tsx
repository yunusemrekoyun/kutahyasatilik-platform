import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";
import { AgencyCard } from "@/components/directory/PublicProfileCards";
import DirectoryPagination from "@/components/directory/DirectoryPagination";
import { getPublicAgencies } from "@/lib/publicDirectory";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kütahya Emlak Ofisleri",
  description:
    "Kütahya'da faaliyet gösteren onaylı emlak ofislerini, danışman ekiplerini ve güncel satılık portföylerini inceleyin.",
  alternates: { canonical: `${SITE.url}/emlak-ofisleri` },
  openGraph: {
    title: "Kütahya Emlak Ofisleri",
    description:
      "Onaylı yerel emlak ofislerini ve güncel Kütahya portföylerini tek yerde karşılaştırın.",
    url: `${SITE.url}/emlak-ofisleri`,
    type: "website",
  },
};

function requestedPage(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(raw) && raw > 0 ? raw : 1;
}

export default async function AgenciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await getPublicAgencies(requestedPage(params.sayfa));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Kütahya Emlak Ofisleri",
    numberOfItems: result.total,
    itemListElement: result.items.map((agency, index) => ({
      "@type": "ListItem",
      position: (result.page - 1) * result.perPage + index + 1,
      url: `${SITE.url}/emlak-ofisi/${agency.slug}`,
      name: agency.name,
    })),
  };

  return (
    <div>
      <TrackView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PageIntro
        eyebrow="Kütahya'nın yerel emlak ağı"
        title="Onaylı emlak ofislerini tanıyın"
        intro="Portföyleri gerçek ilanlardan oluşan yerel ofisleri, danışman ekiplerini ve hizmet verdikleri bölgeleri tek yerden inceleyin."
        actions={
          <Link
            href="/danismanlar"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-paper px-5 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
          >
            Danışmanları gör <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 border-b border-stone pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Yerel portföy ortakları</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950 sm:text-4xl">
              Kütahya emlak ofisleri
            </h2>
          </div>
          <p className="text-sm text-muted">
            <strong className="font-semibold tabular-nums text-ink">{result.total}</strong> aktif ofis
          </p>
        </div>

        {result.items.length ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </div>
            <DirectoryPagination
              basePath="/emlak-ofisleri"
              page={result.page}
              totalPages={result.totalPages}
            />
          </>
        ) : (
          <section className="ceramic-grid mt-8 border-y border-stone bg-paper px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-stone bg-canvas text-brand-700">
              <Building2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-brand-950">
              Onaylı ofis profilleri hazırlanıyor
            </h2>
            <p className="mx-auto mt-2 max-w-xl leading-7 text-muted">
              Yalnızca onay süreci tamamlanmış ve aktif portföyü bulunan ofisler burada yayınlanır.
            </p>
            <Link
              href="/emlakci/kayit"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Ağa katılmak için başvurun
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
