import type { Metadata } from "next";
import {
  ArrowUpRight,
  Building2,
  ExternalLink,
  FileSearch,
  Landmark,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import TrackView from "@/components/TrackView";
import { PageIntro } from "@/components/ui/Editorial";
import {
  getLocalResources,
  LOCAL_RESOURCE_TYPES,
  type PublicLocalResource,
} from "@/lib/localResources";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kütahya Resmî İmar, Parsel ve Belediye Araçları",
  description: "Kütahya'da imar, parsel, adres ve belediye işlemleri için doğrulanmış resmî kurum bağlantılarına güvenli biçimde ulaşın.",
  alternates: { canonical: "/yerel-araclar" },
};

const TYPE_ORDER = ["parcel", "zoning", "municipality", "address", "e_government"];

function ResourceIcon({ type }: { type: string }) {
  if (type === "parcel") return <MapPinned className="h-5 w-5" aria-hidden="true" />;
  if (type === "zoning") return <FileSearch className="h-5 w-5" aria-hidden="true" />;
  if (type === "municipality") return <Building2 className="h-5 w-5" aria-hidden="true" />;
  return <Landmark className="h-5 w-5" aria-hidden="true" />;
}

function formatCheckedAt(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function ResourceRow({ resource }: { resource: PublicLocalResource }) {
  const checkedAt = formatCheckedAt(resource.lastCheckedAt);
  return (
    <li className="grid gap-4 border-b border-stone py-6 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-semibold text-ink">{resource.title}</h3>
          {resource.district ? (
            <span className="rounded-full border border-stone px-2 py-0.5 text-[11px] font-semibold text-muted">{resource.district}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-brand-700">{resource.institution}</p>
        {resource.description ? <p className="mt-2 max-w-2xl leading-7 text-muted">{resource.description}</p> : null}
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Resmî dış hizmet · {resource.host}
          <span className="font-semibold text-green-700">· HTTPS</span>
          {checkedAt ? <span>· Son kontrol {checkedAt}</span> : null}
        </p>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer external"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-200 px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        aria-label={`${resource.title} hizmetini yeni sekmede aç`}
      >
        Kuruma git <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </li>
  );
}

export default async function LocalToolsPage() {
  const resources = await getLocalResources();
  const grouped = new Map<string, PublicLocalResource[]>();
  for (const resource of resources) {
    const items = grouped.get(resource.type) ?? [];
    items.push(resource);
    grouped.set(resource.type, items);
  }
  const types = [...grouped.keys()].sort((a, b) => {
    const aIndex = TYPE_ORDER.indexOf(a);
    const bIndex = TYPE_ORDER.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  return (
    <div>
      <TrackView />
      <PageIntro
        eyebrow="Kamu ve belediye hizmetleri"
        title="Resmî yerel araçlar"
        intro="İmar, parsel, adres ve belediye işlemlerinde ihtiyaç duyabileceğiniz doğrulanmış kurum bağlantılarını tek yerde inceleyin. Her hizmet ilgili kurumun kendi sitesinde açılır."
      />

      <section className="border-b border-stone bg-paper">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-6 md:grid-cols-2">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-muted"><strong className="text-ink">Bağlantı kontrolü:</strong> Yalnız etkin, doğrulanmış ve güvenli HTTPS kurum adresleri gösterilir.</p>
          </div>
          <div className="flex gap-3">
            <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-muted"><strong className="text-ink">Dış hizmet:</strong> Açılan sayfanın içeriği, erişilebilirliği ve işlemleri ilgili kurumun sorumluluğundadır.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
        {resources.length === 0 ? (
          <div className="ceramic-grid border-y border-stone px-5 py-14 text-center">
            <Landmark className="mx-auto h-8 w-8 text-brand-600" aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl font-semibold text-brand-950">Doğrulanmış bağlantılar hazırlanıyor</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">Kurum adresleri doğrulandıktan sonra bu alanda yayımlanacak. Bu sırada arama sonuçlarındaki benzer isimli, resmî olmayan sitelerde kişisel bilgi paylaşmayın.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {types.map((type) => {
              const meta = LOCAL_RESOURCE_TYPES[type] ?? {
                label: "Diğer resmî hizmetler",
                description: "Yerel işlemler için yetkili kurum bağlantıları.",
              };
              return (
                <section key={type} aria-labelledby={`resource-${type}`}>
                  <div className="flex gap-3 border-b border-stone pb-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><ResourceIcon type={type} /></span>
                    <div>
                      <h2 id={`resource-${type}`} className="font-display text-2xl font-semibold text-brand-950">{meta.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted">{meta.description}</p>
                    </div>
                  </div>
                  <ul>{grouped.get(type)?.map((resource) => <ResourceRow key={resource.id} resource={resource} />)}</ul>
                </section>
              );
            })}
          </div>
        )}

        <aside className="mt-14 border-l-2 border-gold-600 bg-canvas px-5 py-4 text-sm leading-6 text-muted">
          Parsel, imar veya tapu ekranlarındaki bilgiler karar öncesi ön kontrol içindir. Bağlayıcı bilgi ve belge için ilgili belediye, tapu müdürlüğü veya yetkili kamu kurumuna başvurun.
        </aside>
      </main>
    </div>
  );
}
