import { NextRequest, NextResponse } from "next/server";
import { getListingSnapshotsBySlugs } from "@/lib/listings";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// İstemcideki karşılaştırma / favori / son gezilen snapshot'larını tazeler.
// Yalnız public (onaylı, yayında) ilanları döner; listede olup burada dönmeyen
// slug artık yayında değildir ve istemci onu listesinden çıkarır.
export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "listing-refresh", 30, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const slugs = Array.isArray(body?.slugs) ? body.slugs : [];
  if (!slugs.length) return NextResponse.json({ ok: true, items: [] });

  try {
    const items = await getListingSnapshotsBySlugs(slugs);
    return NextResponse.json({ ok: true, items });
  } catch {
    // Tazeleme başarısızsa istemci mevcut snapshot'ı korur (ok:false).
    return NextResponse.json({ ok: false, items: [] });
  }
}
