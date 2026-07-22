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

function jsonList(v: unknown): string | null {
  const source = Array.isArray(v) ? v : String(v || "").split(/[\n,]/);
  const values = source
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 30);
  return values.length ? JSON.stringify(values) : null;
}

function parseList(v: string | null): string[] {
  if (!v) return [];
  try {
    const parsed: unknown = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

// Danışman profili — kimlik, yayın onayı ve firma bağlantısı bu uçtan değişmez.
export async function GET(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const p = await prisma.agent.findUnique({
    where: { id: a.agent.id },
    select: {
      name: true,
      phone: true,
      title: true,
      agency: true,
      email: true,
      slug: true,
      logo: true,
      bio: true,
      experienceYears: true,
      specialties: true,
      serviceDistricts: true,
      publicProfile: true,
      showPhone: true,
      showWhatsapp: true,
      agencyRef: { select: { name: true, slug: true } },
    },
  });
  // Logo mobil önizleme için mutlaklaştırılır (görsel gelsin).
  return NextResponse.json({
    ok: true,
    profile: p ? {
      ...p,
      logo: absolutizeUrl(p.logo, req),
      specialties: parseList(p.specialties),
      serviceDistricts: parseList(p.serviceDistricts),
    } : p,
  });
}

export async function PUT(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  const requestedExperience = body.experienceYears === null || body.experienceYears === ""
    ? null
    : Number(body.experienceYears);
  const current = await prisma.agent.findUnique({
    where: { id: a.agent.id },
    select: {
      agency: true,
      agencyId: true,
      agencyRef: { select: { name: true } },
    },
  });
  if (!current) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  await prisma.agent.update({
    where: { id: a.agent.id },
    data: {
      name: String(body.name || a.agent.name).trim(),
      phone: str(body.phone),
      title: str(body.title),
      // agencyId is admin-controlled. Keep the legacy text in sync with that
      // relation, while independent advisers retain their free-text field.
      agency: current.agencyId
        ? current.agencyRef?.name ?? current.agency
        : str(body.agency),
      bio: str(body.bio)?.slice(0, 2000) ?? null,
      experienceYears: requestedExperience !== null && Number.isFinite(requestedExperience)
        ? Math.max(0, Math.min(80, Math.round(requestedExperience)))
        : null,
      specialties: jsonList(body.specialties),
      serviceDistricts: jsonList(body.serviceDistricts),
      showPhone: body.showPhone === true,
      showWhatsapp: body.showWhatsapp === true,
      // logo yalnızca istemci açıkça gönderirse güncellenir (aksi halde mevcut logo korunur).
      ...("logo" in body ? { logo: str(body.logo) } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
