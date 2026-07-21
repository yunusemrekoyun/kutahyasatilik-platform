import type { LucideIcon } from "lucide-react";

/* Ortak sınıf sabitleri — tüm admin sayfalarında aynı dil */
export const adminCard = "rounded-lg bg-paper ring-1 ring-stone";
export const adminInput =
  "h-11 w-full rounded-lg border border-slate-300 bg-paper px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
export const adminLabel = "mb-1.5 block text-sm font-medium text-slate-700";
export const adminBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60";
export const adminBtnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-paper px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-canvas";

/* Sayfa başlığı + aksiyon alanı */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/* Durum rozeti */
const TONES: Record<string, string> = {
  success: "bg-green-50 text-green-700 ring-green-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  neutral: "bg-slate-100 text-slate-600 ring-stone",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/* İstatistik kutusu */
const STAT_TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  green: "bg-green-50 text-green-600",
  gold: "bg-gold-100 text-gold-700",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatTile({
  Icon,
  label,
  value,
  tone = "slate",
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className={`${adminCard} p-5`}>
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${STAT_TONES[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

/* Boş durum */
export function EmptyState({
  Icon,
  title,
  text,
}: {
  Icon: LucideIcon;
  title: string;
  text?: string;
}) {
  return (
    <div className={`${adminCard} p-10 text-center`}>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-semibold text-slate-800">{title}</h3>
      {text && <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{text}</p>}
    </div>
  );
}
