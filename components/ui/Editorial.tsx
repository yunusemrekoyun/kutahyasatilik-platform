import type { ReactNode } from "react";

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
    <section className="relative overflow-hidden bg-brand-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900/80 via-brand-950 to-brand-950" />
      <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 ${visual ? "grid items-stretch gap-8 py-10 lg:grid-cols-12 lg:py-14" : "py-12 sm:py-16"}`}>
        <div className={visual ? "flex flex-col justify-center lg:col-span-7" : ""}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-300">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
          {intro ? <div className="mt-4 max-w-3xl text-base leading-7 text-brand-100 sm:text-lg">{intro}</div> : null}
          {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {visual ? <div className="relative min-h-64 overflow-hidden rounded-xl ring-1 ring-white/15 lg:col-span-5">{visual}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}
