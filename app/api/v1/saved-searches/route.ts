import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiSession } from "@/lib/apiAuth";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kullanıcının hesaba bağlı aktif kayıtlı aramaları (BuyerAlert). Bearer, yalnız role:user.
export async function GET(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: false, items: [] }, { status: 401 });
  }
  try {
    const items = await prisma.buyerAlert.findMany({
      where: { userId: session.id, status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        propertyType: true,
        listingType: true,
        district: true,
        minPrice: true,
        maxPrice: true,
        minArea: true,
        rooms: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

// Kayıtlı aramayı kaldır = soft-close.
export async function DELETE(req: NextRequest) {
  const limited = await checkRate(req, "saved-search", 30, 60_000);
  if (limited) return limited;
  const session = await resolveApiSession(req);
  if (!session || session.role !== "user") {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "id gerekli" }, { status: 400 });
  try {
    await prisma.buyerAlert.updateMany({
      where: { id, userId: session.id },
      data: { status: "closed" },
    });
  } catch {
    /* yoksay */
  }
  return NextResponse.json({ ok: true });
}
