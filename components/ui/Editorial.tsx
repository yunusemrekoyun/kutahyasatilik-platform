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
    <section className="relative overflow-hidden border-b border-stone bg-canvas">
      <div className="ceramic-grid pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-60" />
      <div className={`relative mx-auto max-w-7xl px-5 sm:px-6 ${visual ? "grid items-stretch gap-8 py-10 lg:grid-cols-12 lg:py-14" : "py-12 sm:py-16 lg:py-20"}`}>
        <div className={visual ? "flex flex-col justify-center lg:col-span-7" : ""}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-brand-950 sm:text-5xl lg:text-6xl">{title}</h1>
          {intro ? <div className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{intro}</div> : null}
          {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {visual ? <div className="relative min-h-64 overflow-hidden border border-stone lg:col-span-5">{visual}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl leading-7 text-muted">{description}</p> : null}
    </div>
  );
}
