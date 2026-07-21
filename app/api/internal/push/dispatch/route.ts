import { NextRequest, NextResponse } from "next/server";
import { checkPushReceipts, dispatchPendingPushes } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const [dispatch, receipts] = await Promise.all([dispatchPendingPushes(), checkPushReceipts()]);
  return NextResponse.json({ ok: true, dispatch, receipts, enabled: process.env.PUSH_ENABLED === "true" });
}
