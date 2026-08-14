import { AlertTriangle } from "lucide-react";

/**
 * Operasyonel liste tavanı.
 *
 * Yedi admin ekranı ve emlakçı panosu `take` olmadan `findMany` çağırıyordu:
 * tablo büyüdükçe sorgu da, render da sınırsız büyüyordu. Diğer ekranlar zaten
 * sınırlı (ilanlar 50, onay 25) — desen tutarsızdı.
 *
 * Bu tavan sorguyu bağlıyor ama SAYFALAMA DEĞİL: kesme olduğunda kullanıcıya
 * açıkça söyleniyor, çünkü sessizce kırpılmış bir liste "hepsi bu" gibi okunur.
 * Gerçek sayfalama ayrı iş olarak duruyor.
 */
export const ADMIN_LIST_CAP = 200;

export function ListCapNotice({ shown, total }: { shown: number; total: number }) {
  if (total <= shown) return null;
  return (
    <div className="mb-3 flex items-center gap-2 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
      <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>
        {total} kayıttan ilk <strong className="font-bold tabular-nums">{shown}</strong> tanesi gösteriliyor.
        Aramak için filtre kullanın; tam sayfalama henüz eklenmedi.
      </span>
    </div>
  );
}
