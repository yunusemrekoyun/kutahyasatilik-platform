import { NextRequest, NextResponse } from "next/server";
import { getListingsPaged, type ListingFilter } from "@/lib/listings";
import { absolutizeUrl } from "@/lib/apiMedia";

// Mobil ilan listesi — lib/listings.getListingsPaged üzerine ince JSON sarmal.
// Web SSR ile AYNI veri/filtre mantığını kullanır (onaylı + aktif ilanlar).

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function bool(v: string | null): boolean | undefined {
  return v === "true" || v === "1" ? true : undefined;
}
function str(v: string | null): string | undefined {
  return v && v.trim() ? v.trim() : undefined;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filter: ListingFilter = {
    propertyType: str(sp.get("propertyType")),
    listingType: str(sp.get("listingType")),
    district: str(sp.get("district")),
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    minArea: num(sp.get("minArea")),
    maxArea: num(sp.get("maxArea")),
    rooms: str(sp.get("rooms")),
    zoning: str(sp.get("zoning")),
    furnished: bool(sp.get("furnished")),
    parking: bool(sp.get("parking")),
    balcony: bool(sp.get("balcony")),
    inSite: bool(sp.get("inSite")),
    verified: bool(sp.get("verified")),
    q: str(sp.get("q")),
    sort: str(sp.get("sort")),
  };
  const page = Math.max(1, num(sp.get("page")) ?? 1);
  const perPage = Math.min(50, Math.max(1, num(sp.get("perPage")) ?? 12));

  try {
    const result = await getListingsPaged(filter, page, perPage);
    const items = result.items.map((it) => ({
      ...it,
      coverImage: absolutizeUrl(it.coverImage ?? null, req),
    }));
    return NextResponse.json({ ok: true, ...result, items });
  } catch {
    return NextResponse.json({ ok: false, error: "İlanlar alınamadı" }, { status: 500 });
  }
}
