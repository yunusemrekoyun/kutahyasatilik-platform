import { NextResponse } from "next/server";
import { currentNotificationActor, listNotifications, unreadCount } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentNotificationActor();
  if (!actor) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });

  try {
    const [items, unread] = await Promise.all([
      listNotifications(actor.role, actor.id),
      unreadCount(actor.role, actor.id),
    ]);
    return NextResponse.json({ ok: true, unread, items });
  } catch (error) {
    // Eskiden HER hata sessizce boş listeye çevriliyordu ("tablo henüz yoksa"
    // gerekçesiyle). Migration çoktan uygulandı; artık gerçek bir arıza da
    // "bildiriminiz yok" gibi görünüyor ve hiçbir yere düşmüyordu.
    console.error("[notifications] listeleme başarısız", error);
    return NextResponse.json({ ok: false, error: "Bildirimler yüklenemedi" }, { status: 500 });
  }
}
