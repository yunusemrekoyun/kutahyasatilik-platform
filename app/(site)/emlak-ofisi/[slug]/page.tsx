import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import ListingCard from "@/components/ListingCard";
import TrackView from "@/components/TrackView";
import { AgentCard, PublicContactLinks } from "@/components/directory/PublicProfileCards";
import { publicImageUrl } from "@/lib/media";
import { getPublicAgency } from "@/lib/publicDirectory";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function descriptionFor(value: string | null, name: string) {
  return (
    value?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `${name} güncel Kütahya satılık portföyünü ve gayrimenkul danışmanlarını inceleyin.`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();
  const title = `${agency.name} - Kütahya Emlak Ofisi`;
  const description = descriptionFor(agency.description, agency.name);
  const image = publicImageUrl(agency.coverImage) || publicImageUrl(agency.logo);

  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/emlak-ofisi/${agency.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE.url}/emlak-ofisi/${agency.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function AgencyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getPublicAgency(slug);
  if (!agency) notFound();

  const cover = publicImageUrl(agency.coverImage);
  const logo = publicImageUrl(agency.logo);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agency.name,
    url: `${SITE.url}/emlak-ofisi/${agency.slug}`,
    description: agency.description || undefined,
    image: logo || cover || undefined,
    telephone: agency.phone || undefined,
    sameAs: agency.website ? [agency.website] : undefined,
    address: agency.address
      ? {
          "@type": "PostalAddress",
          streetAddress: agency.address,
          addressRegion: "Kütahya",
          addressCountry: "TR",
        }
      : {
          "@type": "PostalAddress",
          addressRegion: "Kütahya",
          addressCountry: "TR",
        },
  };

  return (
    <div>
      <TrackView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-6">
        <nav className="text-sm text-muted" aria-label="Sayfa yolu">
          <Link href="/" className="hover:text-brand-700">Ana Sayfa</Link>
          <span className="mx-2 text-slate-300">/</span>
          <Link href="/emlak-ofisleri" className="hover:text-brand-700">Emlak Ofisleri</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-ink">{agency.name}</span>
        </nav>
      </div>

      <header className="mx-auto mt-5 max-w-7xl px-5 sm:px-6">
        <div className="relative min-h-56 overflow-hidden border border-stone bg-brand-950 sm:min-h-72">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          ) : (
            <div className="ceramic-grid absolute inset-0 opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/75 to-transparent" />
          <div className="relative flex min-h-56 items-end p-5 sm:min-h-72 sm:p-8">
            <div className="flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-end">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border-4 border-paper bg-paper text-2xl font-bold text-brand-800 sm:h-28 sm:w-28">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={`${agency.name} logosu`} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-10 w-10" />
                )}
              </div>
              <div className="pb-1 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-gold-300">Emlak ofisi</span>
                  {agency.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-paper/95 px-2 py-1 text-xs font-semibold text-brand-800">
                      <BadgeCheck className="h-3.5 w-3.5" /> Doğrulanmış
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/30 px-2 py-1 text-xs font-semibold text-white">
                      <ShieldCheck className="h-3.5 w-3.5" /> Onaylı profil
                    </span>
                  )}
                </div>
                <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {agency.name}
                </h1>
                {agency.address ? (
                  <p className="mt-3 inline-flex items-start gap-2 text-sm text-brand-100 sm:text-base">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> {agency.address}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-6 sm:pt-10">
        <section className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 divide-x divide-stone border-y border-stone bg-paper sm:grid-cols-3">
              <div className="px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Aktif portföy</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-brand-950">{agency.listingCount}</p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Danışman</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-brand-950">{agency.agentCount}</p>
              </div>
              <div className="col-span-2 border-t border-stone px-4 py-5 sm:col-span-1 sm:border-t-0 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Profil durumu</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
                  <ShieldCheck className="h-4 w-4" /> Onaylı
                </p>
              </div>
            </div>

            <div className="mt-8 border-b border-stone pb-8">
              <p className="eyebrow">Ofis hakkında</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950">Yerel uzmanlık, güncel portföy</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-700">
                {agency.description || `${agency.name}, Kütahya'daki aktif satılık portföyünü ve danışman ekibini bu profil üzerinden yayınlıyor.`}
              </p>
            </div>

            {agency.serviceDistricts.length ? (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Hizmet verilen bölgeler</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agency.serviceDistricts.map((district) => (
                    <Link
                      key={district}
                      href={`/ilanlar?ilce=${encodeURIComponent(district)}`}
                      className="rounded-md border border-stone bg-paper px-3 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-300"
                    >
                      {district}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="border border-stone border-t-[3px] border-t-gold-700 bg-paper p-6 lg:sticky lg:top-24">
              <p className="eyebrow">Doğrudan iletişim</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-brand-950">{agency.name}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Yalnızca ofisin paylaşmayı seçtiği iletişim bilgileri gösterilir.
              </p>
              <div className="mt-5">
                <PublicContactLinks
                  name={agency.name}
                  phone={agency.phone}
                  whatsapp={agency.whatsapp}
                  website={agency.website}
                />
              </div>
            </div>
          </aside>
        </section>

        {agency.agents.length ? (
          <section className="mt-16 border-t border-stone pt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Ekip</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950">Ofisin danışmanları</h2>
              </div>
              <Link href="/danismanlar" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
                Tüm danışmanlar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {agency.agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </section>
        ) : null}

        <section className="mt-16 border-t border-stone pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Güncel portföy</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950">Ofisin aktif ilanları</h2>
            </div>
            <Link href={`/ilanlar?ofis=${encodeURIComponent(agency.slug)}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              Tüm {agency.listingCount} ilanı gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agency.listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} priority={index < 3} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
