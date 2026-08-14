import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_LIST } from "@/lib/categories";

/**
 * Kategori seçim ızgarası — ana sayfa ve kategorisiz /ilanlar aynı bileşeni kullanır.
 *
 * "Tüm ilanlar" girişi kaldırıldı: 360 ilanlık bir katalogda filtresiz liste
 * kullanıcıya karar verdirmiyor, yoruyor. Alt türler çip olarak açık, böylece
 * tek tıkla daraltılmış listeye düşülüyor.
 */
export default function CategoryPicker({
  counts,
  className = "",
}: {
  /** Kategori anahtarı -> aktif ilan sayısı. Verilmezse sayaç gösterilmez. */
  counts?: Record<string, number>;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {CATEGORY_LIST.map((category) => {
        const count = counts?.[category.key];
        return (
          <div key={category.key} className="rounded-card border border-stone bg-paper p-4">
            <Link
              href={`/ilanlar?kategori=${category.key}`}
              className="group flex items-center justify-between gap-3"
            >
              <span className="text-base font-bold text-ink group-hover:text-brand-700">
                {category.label}
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm tabular-nums text-muted">
                {count !== undefined ? `${count} ilan` : "Tümü"}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {category.subTypes.map((sub) => (
                <Link
                  key={sub.value}
                  href={`/ilanlar?kategori=${category.key}&tur=${sub.value}`}
                  className="rounded-control border border-stone px-2.5 py-1 text-xs font-medium text-ink transition hover:border-brand-300 hover:text-brand-700"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
