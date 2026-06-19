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
  } catch {
    // Tablo henüz yoksa (migration deploy edilmedi) boş dön — UI patlamasın.
    return NextResponse.json({ ok: true, unread: 0, items: [] });
  }
}
