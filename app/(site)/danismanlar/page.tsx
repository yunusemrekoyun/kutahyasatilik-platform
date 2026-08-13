import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";
import { AgentCard } from "@/components/directory/PublicProfileCards";
import DirectoryPagination from "@/components/directory/DirectoryPagination";
import { getPublicAgents } from "@/lib/publicDirectory";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kütahya Gayrimenkul Danışmanları",
  description:
    "Kütahya'nın onaylı gayrimenkul danışmanlarını, uzmanlık bölgelerini ve güncel satılık ilanlarını inceleyin.",
  alternates: { canonical: `${SITE.url}/danismanlar` },
  openGraph: {
    title: "Kütahya Gayrimenkul Danışmanları",
    description:
      "Onaylı yerel danışmanları, uzmanlıklarını ve aktif portföylerini karşılaştırın.",
    url: `${SITE.url}/danismanlar`,
    type: "website",
  },
};

function requestedPage(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(raw) && raw > 0 ? raw : 1;
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await getPublicAgents(requestedPage(params.sayfa));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Kütahya Gayrimenkul Danışmanları",
    numberOfItems: result.total,
    itemListElement: result.items.map((agent, index) => ({
      "@type": "ListItem",
      position: (result.page - 1) * result.perPage + index + 1,
      url: `${SITE.url}/danisman/${agent.slug}`,
      name: agent.name,
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
        eyebrow="Sahadaki uzmanlık"
        title="Kütahya'yı bilen danışmanlarla çalışın"
        intro="Uzmanlık alanını, hizmet verdiği ilçeleri ve aktif portföyünü inceleyerek sizin için doğru danışmanı bulun."
        actions={
          <Link
            href="/emlak-ofisleri"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-paper px-5 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
          >
            Emlak ofislerini gör <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 border-b border-stone pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Onaylı profesyoneller</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950 sm:text-4xl">
              Gayrimenkul danışmanları
            </h2>
          </div>
          <p className="text-sm text-muted">
            <strong className="font-semibold tabular-nums text-ink">{result.total}</strong> aktif danışman
          </p>
        </div>

        {result.items.length ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
            <DirectoryPagination
              basePath="/danismanlar"
              page={result.page}
              totalPages={result.totalPages}
            />
          </>
        ) : (
          <section className="ceramic-grid mt-8 border-y border-stone bg-paper px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-stone bg-canvas text-brand-700">
              <UsersRound className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-brand-950">
              Onaylı danışman profilleri hazırlanıyor
            </h2>
            <p className="mx-auto mt-2 max-w-xl leading-7 text-muted">
              Yalnızca onayı tamamlanmış, profilini yayına açmış ve aktif ilanı bulunan danışmanlar listelenir.
            </p>
            <Link
              href="/emlakci/kayit"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Danışman olarak başvurun
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
