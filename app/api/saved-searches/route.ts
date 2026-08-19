import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/userAuth";
import { checkRate } from "@/lib/rateLimit";
import { reportApiError } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kullanıcının hesaba bağlı (aktif) kayıtlı aramaları.
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, items: [] }, { status: 401 });
  try {
    const items = await prisma.buyerAlert.findMany({
      where: { userId: session.userId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        // category ve attributes ŞART: bunlarsız istemci her aramayı emlak sanıp
        // alt türü emlak sözlüğünde arıyor ve alanı "m²" ile yazıyordu — vasıta
        // araması "otomobil · 0 m²" gibi görünüyordu.
        id: true, category: true, attributes: true,
        propertyType: true, listingType: true, district: true,
        minPrice: true, maxPrice: true, minArea: true, rooms: true, createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    // Eskiden { ok: true, items: [] } dönüyordu: veritabanı hatası kullanıcıya
    // "kayıtlı aramanız yok" olarak görünüyor, üstelik hiçbir yere iz düşmüyordu.
    reportApiError("saved-searches:list", error);
    return NextResponse.json({ ok: false, error: "Kayıtlı aramalar yüklenemedi." }, { status: 500 });
  }
}

// Kayıtlı aramayı kaldır = soft-close (lead kaydı admin'de kalır, eşleşme/bildirim durur).
export async function DELETE(req: NextRequest) {
  const limited = await checkRate(req, "saved-search", 30, 60_000);
  if (limited) return limited;
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "id gerekli" }, { status: 400 });
  try {
    await prisma.buyerAlert.updateMany({
      where: { id, userId: session.userId },
      data: { status: "closed" },
    });
  } catch (error) {
    // Hata yutulup { ok: true } dönüyordu: kullanıcı aramayı sildiğini sanıyor,
    // arayüzden kayboluyor ama kayıt "active" kalıp bildirim üretmeye devam ediyordu.
    reportApiError("saved-searches:delete", error);
    return NextResponse.json({ ok: false, error: "Kayıtlı arama kaldırılamadı." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
