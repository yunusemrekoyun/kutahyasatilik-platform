import { NextResponse } from "next/server";
import { CATEGORY_LIST } from "@/lib/categories";
import { sortOptionsFor } from "@/lib/listingFilters";

export const runtime = "nodejs";
// Kayıt kodda sabit; her istekte hesaplanacak bir şey yok.
export const dynamic = "force-static";

/**
 * Kategori kaydını yayınlar — kategori/alt tür/alan tanımlarının TEK KAYNAĞI
 * `web/lib/categories.ts`'tir ve mobil onun kopyasını taşımamalıdır.
 *
 * Bu uç yokken mobil, kategori sekmelerini `src/lib/labels.ts` içinde hard-code
 * ediyordu: web'e yeni kategori eklendiğinde mobil sürüm çıkmadan görünmüyordu.
 *
 * Yanıt kaydın kendisidir; alan adları `CategoryDef` ile birebir aynı tutulmalı.
 * Eski mobil sürümler bilmedikleri alanları yok sayar, dolayısıyla kayda alan
 * eklemek geriye uyumludur.
 */
export function GET() {
  // Sıralama seçenekleri de kayda dahil: mobil listeyi kopyalarsa web'e yeni
  // bir sıralama eklendiğinde uygulama sürümü çıkmadan görünmez — kategori
  // sekmelerinde tam olarak bu sorun yaşanmıştı.
  return NextResponse.json({
    ok: true,
    categories: CATEGORY_LIST.map((category) => ({
      ...category,
      sortOptions: sortOptionsFor(category.key),
    })),
  });
}
