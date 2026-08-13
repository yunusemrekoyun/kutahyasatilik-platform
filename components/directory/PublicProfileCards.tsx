import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { publicImageUrl } from "@/lib/media";
import type { PublicAgencyCard, PublicAgentCard } from "@/lib/publicDirectory";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

export function AgencyCard({ agency }: { agency: PublicAgencyCard }) {
  const cover = publicImageUrl(agency.coverImage);
  const logo = publicImageUrl(agency.logo);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-stone bg-paper transition hover:border-brand-300">
      <div className="relative aspect-[16/7] overflow-hidden border-b border-stone bg-brand-950">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="ceramic-grid h-full w-full opacity-70" />
        )}
        {agency.verified ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-paper/95 px-2 py-1 text-[11px] font-bold text-brand-800">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-600" /> Doğrulanmış
          </span>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-10">
        <div className="absolute -top-8 left-5 grid h-16 w-16 place-items-center overflow-hidden rounded-lg border-4 border-paper bg-canvas text-lg font-bold text-brand-800">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`${agency.name} logosu`} className="h-full w-full object-contain" />
          ) : (
            <span aria-hidden="true">{initials(agency.name)}</span>
          )}
        </div>

        <p className="eyebrow">Emlak ofisi</p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-brand-950">
          <Link href={`/emlak-ofisi/${agency.slug}`} className="after:absolute after:inset-0 after:z-10">
            {agency.name}
          </Link>
        </h2>

        {agency.address ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <span className="line-clamp-1">{agency.address}</span>
          </p>
        ) : null}

        {agency.description ? (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{agency.description}</p>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted">
            Kütahya portföyünü ve danışman ekibini inceleyin.
          </p>
        )}

        <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-stone pt-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-brand-500" /> {agency.listingCount} aktif ilan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-4 w-4 text-brand-500" /> {agency.agentCount} danışman
          </span>
        </div>

        <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
          Ofisi incele <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

export function AgentCard({ agent }: { agent: PublicAgentCard }) {
  const logo = publicImageUrl(agent.logo);

  return (
    <article className="group relative flex h-full flex-col border border-stone bg-paper p-5 transition hover:border-brand-300">
      <div className="flex items-start gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-50 text-xl font-bold text-brand-800">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`${agent.name} profil fotoğrafı`} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials(agent.name)}</span>
          )}
        </div>
        <div className="min-w-0 pt-1">
          <p className="eyebrow">Gayrimenkul danışmanı</p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight text-brand-950">
            <Link href={`/danisman/${agent.slug}`} className="after:absolute after:inset-0 after:z-10">
              {agent.name}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-muted">{agent.title || "Gayrimenkul Danışmanı"}</p>
        </div>
      </div>

      {agent.agency ? (
        <p className="relative mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <BriefcaseBusiness className="h-4 w-4" /> {agent.agency.name}
        </p>
      ) : null}

      {agent.bio ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{agent.bio}</p>
      ) : null}

      <div className="relative mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-stone pt-4 text-sm text-slate-600">
        <span>{agent.listingCount} aktif ilan</span>
        {agent.experienceYears ? <span>{agent.experienceYears} yıl deneyim</span> : null}
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
        Profili incele <ArrowRight className="h-4 w-4" />
      </span>
    </article>
  );
}

function safePhoneHref(phone: string | null): string | null {
  if (!phone) return null;
  const normalized = phone.trim().replace(/[^\d+]/g, "");
  return normalized.replace(/\D/g, "").length >= 10 ? `tel:${normalized}` : null;
}

function safeWhatsappHref(value: string | null, name: string): string | null {
  if (!value) return null;
  const number = value.replace(/\D/g, "");
  if (number.length < 10 || number.length > 15) return null;
  const message = encodeURIComponent(`Merhaba, ${name} profili hakkında bilgi almak istiyorum.`);
  return `https://wa.me/${number}?text=${message}`;
}

export function PublicContactLinks({
  name,
  phone,
  whatsapp,
  website,
}: {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  website?: string | null;
}) {
  const phoneHref = safePhoneHref(phone);
  const whatsappHref = safeWhatsappHref(whatsapp, name);

  if (!phoneHref && !whatsappHref && !website) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {phoneHref ? (
        <a
          href={phoneHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          <Phone className="h-4 w-4" /> Ara
        </a>
      ) : null}
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-paper px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      ) : null}
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone bg-paper px-4 text-sm font-semibold text-ink transition hover:border-brand-300"
        >
          <ExternalLink className="h-4 w-4" /> İnternet sitesi
        </a>
      ) : null}
    </div>
  );
}
