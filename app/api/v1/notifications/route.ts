import { NextRequest, NextResponse } from "next/server";
import { resolveApiSession } from "@/lib/apiAuth";
import { listNotifications, unreadCount } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bildirimler — her rol (user/agent/admin) kendi bildirimlerini görür. Bearer destekli.
export async function GET(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  try {
    const [items, unread] = await Promise.all([
      listNotifications(session.role, session.id),
      unreadCount(session.role, session.id),
    ]);
    return NextResponse.json({ ok: true, unread, items });
  } catch {
    return NextResponse.json({ ok: true, unread: 0, items: [] });
  }
}
