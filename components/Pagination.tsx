import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "sayfa") params.set(k, v);
    });
    if (p > 1) params.set("sayfa", String(p));
    const qs = params.toString();
    return `/ilanlar${qs ? `?${qs}` : ""}`;
  };

  // Yalnızca gerekli sayfaları hesapla (1, son, ve current±1) — totalPages kadar
  // döngü kurmadan. Çok büyük katalogda (binlerce sayfa) gereksiz CPU'yu önler.
  const want = new Set<number>([1, totalPages]);
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) want.add(i);
  const sorted = [...want].sort((a, b) => a - b);
  const pages: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages.push("...");
    pages.push(p);
    prev = p;
  }

  const btn = "grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-medium transition";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className={`${btn} bg-paper text-slate-700 ring-1 ring-stone hover:ring-brand-300`}>‹ Önceki</Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <Link
            key={p}
            href={makeHref(p)}
            className={`${btn} ${p === page ? "bg-brand-700 text-white" : "bg-paper text-slate-700 ring-1 ring-stone hover:ring-brand-300"}`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className={`${btn} bg-paper text-slate-700 ring-1 ring-stone hover:ring-brand-300`}>Sonraki ›</Link>
      )}
    </nav>
  );
}
