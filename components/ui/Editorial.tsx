import type { ReactNode } from "react";

/* Sayfa başlığı ve bölüm başlığı — 10 public sayfa buradan besleniyor.
 * Dosya adı editoryal dönemden kalma; yeniden adlandırma 10 import satırı
 * demek olduğu için ertelendi (bkz. UYGULAMA-PLANI §12, Faz 1). */

export function PageIntro({
  eyebrow,
  title,
  intro,
  actions,
  visual,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
}) {
  return (
    <section className="border-b border-stone bg-paper">
      <div
        className={`mx-auto max-w-7xl px-5 sm:px-6 ${
          visual ? "grid items-center gap-8 py-8 lg:grid-cols-12 lg:py-10" : "py-8 sm:py-10"
        }`}
      >
        <div className={visual ? "lg:col-span-7" : ""}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {intro ? (
            <div className="mt-3 max-w-3xl text-[15px] leading-7 text-muted">{intro}</div>
          ) : null}
          {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>
        {visual ? (
          <div className="relative min-h-52 overflow-hidden rounded-card border border-stone lg:col-span-5">
            {visual}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
