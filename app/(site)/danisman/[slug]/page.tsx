import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, MapPin, ShieldCheck, UserRound } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import TrackView from "@/components/TrackView";
import { PublicContactLinks } from "@/components/directory/PublicProfileCards";
import { publicImageUrl } from "@/lib/media";
import { getPublicAgent } from "@/lib/publicDirectory";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function descriptionFor(value: string | null, name: string) {
  return (
    value?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `${name} güncel Kütahya satılık ilanlarını, uzmanlık bölgelerini ve danışman profilini inceleyin.`
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getPublicAgent(slug);
  if (!agent) notFound();
  const title = `${agent.name} - Gayrimenkul Danışmanı`;
  const description = descriptionFor(agent.bio, agent.name);
  const image = publicImageUrl(agent.logo);

  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/danisman/${agent.slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${SITE.url}/danisman/${agent.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getPublicAgent(slug);
  if (!agent) notFound();
  const photo = publicImageUrl(agent.logo);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: agent.name,
    jobTitle: agent.title || "Gayrimenkul Danışmanı",
    url: `${SITE.url}/danisman/${agent.slug}`,
    image: photo || undefined,
    description: agent.bio || undefined,
    telephone: agent.phone || undefined,
    worksFor: agent.agency
      ? {
          "@type": "RealEstateAgent",
          name: agent.agency.name,
          url: `${SITE.url}/emlak-ofisi/${agent.agency.slug}`,
        }
      : undefined,
    areaServed: agent.serviceDistricts.length
      ? agent.serviceDistricts.map((name) => ({ "@type": "AdministrativeArea", name }))
      : undefined,
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
          <Link href="/danismanlar" className="hover:text-brand-700">Danışmanlar</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-ink">{agent.name}</span>
        </nav>
      </div>

      <header className="relative mt-5 overflow-hidden border-y border-stone bg-brand-950">
        <div className="ceramic-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-[auto_1fr] md:items-center md:py-14">
          <div className="grid h-36 w-36 place-items-center overflow-hidden rounded-lg border-4 border-paper bg-paper text-brand-800 sm:h-44 sm:w-44">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={`${agent.name} profil fotoğrafı`} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-16 w-16" />
            )}
          </div>
          <div className="max-w-3xl text-white">
            <span className="inline-flex items-center gap-1 rounded-md border border-white/25 px-2.5 py-1 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-300" /> Onaylı danışman
            </span>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{agent.name}</h1>
            <p className="mt-2 text-lg text-brand-100">{agent.title || "Gayrimenkul Danışmanı"}</p>
            {agent.agency ? (
              <Link
                href={`/emlak-ofisi/${agent.agency.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200"
              >
                <BriefcaseBusiness className="h-4 w-4" /> {agent.agency.name}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 divide-x divide-stone border-y border-stone bg-paper sm:grid-cols-3">
              <div className="px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Aktif ilan</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-brand-950">{agent.listingCount}</p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Deneyim</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand-950">
                  {agent.experienceYears ? `${agent.experienceYears} yıl` : "Yerel uzmanlık"}
                </p>
              </div>
              <div className="col-span-2 border-t border-stone px-4 py-5 sm:col-span-1 sm:border-t-0 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Profil</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
                  <ShieldCheck className="h-4 w-4" /> Onaylı
                </p>
              </div>
            </div>

            <div className="mt-8 border-b border-stone pb-8">
              <p className="eyebrow">Danışman hakkında</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950">Sahadan bilgi, açık iletişim</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-700">
                {agent.bio || `${agent.name}, Kütahya'daki aktif portföyünü ve uzmanlık bölgelerini bu profil üzerinden paylaşıyor.`}
              </p>
            </div>

            {agent.specialties.length ? (
              <div className="mt-8 border-b border-stone pb-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Uzmanlık alanları</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.specialties.map((specialty) => (
                    <span key={specialty} className="rounded-md border border-stone bg-paper px-3 py-2 text-sm font-semibold text-ink">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {agent.serviceDistricts.length ? (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Hizmet verilen bölgeler</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.serviceDistricts.map((district) => (
                    <Link
                      key={district}
                      href={`/ilanlar?ilce=${encodeURIComponent(district)}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-stone bg-paper px-3 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-300"
                    >
                      <MapPin className="h-3.5 w-3.5" /> {district}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="border border-stone border-t-[3px] border-t-gold-700 bg-paper p-6 lg:sticky lg:top-24">
              <p className="eyebrow">Danışmana ulaşın</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-brand-950">{agent.name}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Telefon ve WhatsApp yalnızca danışmanın açık izni varsa gösterilir.
              </p>
              <div className="mt-5">
                <PublicContactLinks
                  name={agent.name}
                  phone={agent.phone}
                  whatsapp={agent.whatsapp}
                />
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-16 border-t border-stone pt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Güncel portföy</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-brand-950">Danışmanın aktif ilanları</h2>
            </div>
            <Link href={`/ilanlar?danisman=${encodeURIComponent(agent.slug)}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              Tüm {agent.listingCount} ilanı gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agent.listings.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} priority={index < 3} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
