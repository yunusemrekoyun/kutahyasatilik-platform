import { NextRequest, NextResponse } from "next/server";
import { getMapPoints, type ListingFilter } from "@/lib/listings";
import { absolutizeUrl } from "@/lib/apiMedia";

export const dynamic = "force-dynamic";

// Tüm ilanların harita noktaları (lat/lng olanlar) — mobil harita ekranı.
// lib/listings.getMapPoints sarmalı (web haritasıyla AYNI veri); coverImage mutlak.

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
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
    rooms: str(sp.get("rooms")),
  };
  try {
    const points = await getMapPoints(filter);
    const items = points.map((p) => ({ ...p, coverImage: absolutizeUrl(p.coverImage, req) }));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
