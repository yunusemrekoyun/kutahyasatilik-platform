import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAgent } from "@/lib/apiAgent";
import { absolutizeUrl } from "@/lib/apiMedia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: unknown): string | null {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s === "" ? null : s;
}

// Emlakçı profili (name/phone/title/agency) — görüntüle/güncelle. email/slug/status/şifre DEĞİŞMEZ.
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const p = await prisma.agent.findUnique({
    where: { id: a.agent.id },
    select: { name: true, phone: true, title: true, agency: true, email: true, slug: true, logo: true },
  });
  // Logo mobil önizleme için mutlaklaştırılır (görsel gelsin).
  return NextResponse.json({ ok: true, profile: p ? { ...p, logo: absolutizeUrl(p.logo, req) } : p });
}

export async function PUT(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  await prisma.agent.update({
    where: { id: a.agent.id },
    data: {
      name: String(body.name || a.agent.name).trim(),
      phone: str(body.phone),
      title: str(body.title),
      agency: str(body.agency),
      // logo yalnızca istemci açıkça gönderirse güncellenir (aksi halde mevcut logo korunur).
      ...("logo" in body ? { logo: str(body.logo) } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
