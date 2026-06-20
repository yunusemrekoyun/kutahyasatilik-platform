import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sağlık kontrolü: DB'ye hafif bir sorgu atar. Uptime/monitoring (Cloudflare,
// UptimeRobot, load balancer) bu endpoint'i izler. Asla cache'lenmemeli.
export const dynamic = "force-dynamic";

export async function GET() {
  // İç durum (db/saat) sızdırmadan yalnız sağlık sinyali döner; monitoring 200/503 ile izler.
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
