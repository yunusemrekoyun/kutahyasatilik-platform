import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { countListingsForAlert } from "@/lib/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Alıcı talepleri (kayıtlı arama) — sayfalı + her satır için uygun ilan sayısı (runtime hesap).
export async function GET(req: NextRequest) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const perPage = 30;

  const [rows, total] = await Promise.all([
    prisma.buyerAlert.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.buyerAlert.count(),
  ]);
  // Kaydın TAMAMI geçiliyor (web ikizi de öyle yapıyor). Alanlar tek tek
  // sayıldığında `category` ve `attributes` dışarıda kalıyordu: countListingsForAlert
  // kategorisiz talebi emlak sayıp emlak alanlarıyla sorguluyor, dolayısıyla her
  // vasıta/teknoloji talebi "0 eşleşme" gösteriyordu.
  const matchCounts = await Promise.all(
    rows.map((r) => countListingsForAlert(r).catch(() => 0)),
  );
  const items = rows.map((r, i) => ({
    id: r.id, name: r.name, phone: r.phone, email: r.email,
    // category/attributes olmadan mobil admin ekranı alt türü emlak sözlüğünde arar.
    category: r.category, attributes: r.attributes,
    propertyType: r.propertyType, listingType: r.listingType, district: r.district,
    minPrice: r.minPrice, maxPrice: r.maxPrice, minArea: r.minArea, rooms: r.rooms,
    note: r.note, status: r.status, createdAt: r.createdAt, matchCount: matchCounts[i],
  }));
  return NextResponse.json({ ok: true, items, total, page, perPage });
}
