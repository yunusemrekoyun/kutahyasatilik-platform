import { NextRequest, NextResponse } from "next/server";
import { currentNotificationActor, markRead, markAllRead } from "@/lib/notify";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "notif-read", 60, 60_000);
  if (limited) return limited;
  const actor = await currentNotificationActor();
  if (!actor) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    if (body?.all) {
      await markAllRead(actor.role, actor.id);
    } else if (body?.id) {
      await markRead(String(body.id), actor.role, actor.id);
    } else {
      return NextResponse.json({ ok: false, error: "id veya all gerekli" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
