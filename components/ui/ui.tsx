import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * Public yüzeylerin tek stil kaynağı.
 *
 * Panel tarafındaki `components/admin/ui.tsx` ile aynı kalıp: sınıf sabitleri +
 * küçük bileşenler. Amaç, her dosyanın kendi `inputCls`'ini yazmasını bitirmek
 * (bugün 28 dosya kendi kopyasını taşıyor).
 *
 * Tasarım dili: nötr yüzey (canvas/paper/stone), tek font ailesi, kontrolde 6px
 * kart 8px köşe, kıl çizgi yerine ince gölge. Lacivert taşıyıcı + altın vurgu
 * marka kimliği olarak korunur.
 * ------------------------------------------------------------------------- */

/* Yüzey */
export const card = "rounded-card border border-stone bg-paper";
export const cardInteractive =
  "rounded-card border border-stone bg-paper transition hover:border-brand-300 hover:shadow-card";

/* Kontrol */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-control border border-stone bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50";
export const btnAccent =
  "inline-flex items-center justify-center gap-2 rounded-control bg-gold-500 px-4 py-2.5 text-sm font-bold text-brand-950 transition hover:bg-gold-400 disabled:opacity-60";

/* Form */
export const input =
  "h-11 w-full rounded-control border border-stone bg-paper px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
export const select = input + " pr-9 appearance-none";
export const textarea =
  "w-full rounded-control border border-stone bg-paper px-3.5 py-2.5 text-[15px] leading-6 text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
export const label = "mb-1.5 block text-sm font-medium text-ink";

export function Field({
  label: text,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <span className={label}>{text}</span>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* Rozet — panel tarafındaki StatusBadge ile aynı ton sözlüğü */
const TONES = {
  neutral: "bg-canvas text-muted ring-stone",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  accent: "bg-gold-100 text-gold-800 ring-gold-200",
  success: "bg-green-50 text-green-700 ring-green-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
} as const;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-xs font-semibold ring-1 ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* Filtre çipi — kaldırılabilir aktif filtre göstergesi */
export function Chip({ children, onRemove }: { children: ReactNode; onRemove?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-control border border-stone bg-paper py-1 pl-2.5 pr-1.5 text-xs font-medium text-ink">
      {children}
      {onRemove}
    </span>
  );
}
