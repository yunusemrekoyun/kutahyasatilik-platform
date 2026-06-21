import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { notifyAgent } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: unknown): string | null {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s === "" ? null : s;
}

// Emlakçı onayla/reddet/askıya al (web actions parity).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");

  if (action === "approve") {
    await prisma.agent.update({ where: { id }, data: { status: "approved", approvedAt: new Date(), note: null } });
    await notifyAgent(id, { type: "system", title: "Başvurunuz onaylandı", body: "Danışman hesabınız aktif. Giriş yapıp ilan ekleyebilirsiniz.", link: "/emlakci/panel" });
    return NextResponse.json({ ok: true });
  }
  if (action === "reject") {
    await prisma.agent.update({ where: { id }, data: { status: "rejected", note: str(body?.note) } });
    return NextResponse.json({ ok: true });
  }
  if (action === "suspend") {
    await prisma.agent.update({ where: { id }, data: { status: "suspended" } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Geçersiz işlem" }, { status: 400 });
}

// Emlakçı sil (ilanlar SetNull ile admin'e devrolur).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
