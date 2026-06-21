import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { deleteUploadFiles } from "@/lib/uploads";
import { deleteVideo } from "@/lib/videoStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// featured/verified/status kısmi güncelleme (web'de yalnız tam-kaydet vardı; mobil için hızlı toggle).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });

  const data: { featured?: boolean; verified?: boolean; status?: string } = {};
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.verified === "boolean") data.verified = body.verified;
  if (typeof body.status === "string" && ["active", "sold", "passive"].includes(body.status)) {
    data.status = body.status;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Güncellenecek alan yok" }, { status: 400 });

  await prisma.listing.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

// İlanı sil + görsel/video dosyalarını temizle (web deleteListing parity).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { videoUrl: true, images: { select: { url: true } } },
  });
  await prisma.listing.delete({ where: { id } });
  await deleteUploadFiles(existing?.images.map((i) => i.url) ?? []);
  await deleteVideo(existing?.videoUrl);
  return NextResponse.json({ ok: true });
}
