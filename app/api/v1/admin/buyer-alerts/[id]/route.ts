import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const status = String(body?.status ?? "");
  if (!["active", "paused", "closed"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum" }, { status: 400 });
  }
  await prisma.buyerAlert.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  await prisma.buyerAlert.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
