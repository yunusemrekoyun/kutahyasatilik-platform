import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { slugify } from "@/lib/format";
import { notifyAgent } from "@/lib/notify";
import { sendEmail, notificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: unknown): string | null {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s === "" ? null : s;
}

// Başvuru aksiyonları (web actions parity): action = status | offer | activate.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");

  try {
    if (action === "status") {
      const status = String(body?.status ?? "applied");
      const adminNote = str(body?.adminNote);
      const advanced = ["accepted", "awaiting_payment", "activated"];
      const current = await prisma.agentApplication.findUnique({ where: { id }, select: { status: true } });
      if (!current) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı" }, { status: 404 });
      if (advanced.includes(current.status) && !advanced.includes(status)) {
        await prisma.agentApplication.update({ where: { id }, data: { adminNote } });
      } else {
        await prisma.agentApplication.update({ where: { id }, data: { status, adminNote } });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "offer") {
      const app = await prisma.agentApplication.findUnique({ where: { id } });
      if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı" }, { status: 404 });
      if (app.agentId) return NextResponse.json({ ok: false, error: "Bu başvuru zaten aktive edilmiş" }, { status: 400 });
      const pkg = await prisma.package.findFirst({ orderBy: { createdAt: "asc" } });
      if (!pkg) return NextResponse.json({ ok: false, error: "Önce paket tanımlayın (web /admin/paket)" }, { status: 400 });

      await prisma.offer.updateMany({ where: { applicationId: id, status: "active" }, data: { status: "superseded" } });
      const last = await prisma.offer.findFirst({ where: { applicationId: id }, orderBy: { version: "desc" }, select: { version: true } });
      const version = (last?.version ?? 0) + 1;
      await prisma.offer.create({
        data: {
          applicationId: id, version,
          snapshotName: pkg.name, snapshotPrice: pkg.price, snapshotFeatures: pkg.features, interval: pkg.interval,
          validUntil: new Date(Date.now() + 7 * 24 * 3600_000),
        },
      });
      await prisma.agentApplication.update({ where: { id }, data: { status: "offer_sent" } });
      await sendEmail({
        to: app.email,
        subject: "Danışman teklifiniz hazır",
        html: notificationEmail({ title: "Danışman teklifiniz hazır", body: "Teklifinizi görüntülemek için e-postanız ve telefonunuzun son 4 hanesiyle doğrulama yapın.", link: "/emlakci/teklif" }),
      }).catch(() => {});
      return NextResponse.json({ ok: true, version });
    }

    if (action === "activate") {
      const password = String(body?.password ?? "");
      if (password.length < 6) return NextResponse.json({ ok: false, error: "Parola en az 6 karakter olmalı" }, { status: 400 });
      const app = await prisma.agentApplication.findUnique({ where: { id } });
      if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı" }, { status: 404 });
      if (app.agentId) return NextResponse.json({ ok: false, error: "Bu başvuru zaten aktive edilmiş" }, { status: 400 });
      if (app.status === "rejected") return NextResponse.json({ ok: false, error: "Reddedilmiş başvuru aktive edilemez" }, { status: 400 });
      const email = app.email.toLowerCase();
      const dup = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
      if (dup) return NextResponse.json({ ok: false, error: "Bu e-posta zaten kayıtlı bir danışmana ait" }, { status: 409 });

      const root = slugify(app.name) || "danisman";
      let slug = root;
      let i = 1;
      while (await prisma.agent.findUnique({ where: { slug }, select: { id: true } })) slug = `${root}-${i++}`;

      let agencyId: string | null = null;
      const applicationAgency = app.agency?.trim().replace(/\s+/g, " ") || null;
      if (applicationAgency) {
        let agency = await prisma.agency.findFirst({
          where: { name: { equals: applicationAgency, mode: "insensitive" } },
          select: { id: true },
        });
        if (!agency) {
          const agencyRoot = slugify(applicationAgency) || "emlak-ofisi";
          let agencySlug = agencyRoot;
          let agencySuffix = 1;
          while (await prisma.agency.findUnique({ where: { slug: agencySlug }, select: { id: true } })) {
            agencySlug = `${agencyRoot}-${agencySuffix++}`;
          }
          agency = await prisma.agency.create({
            data: { name: applicationAgency, slug: agencySlug },
            select: { id: true },
          });
        }
        agencyId = agency.id;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const agent = await prisma.agent.create({
        data: {
          email, passwordHash, name: app.name, phone: app.phone,
          title: app.title || "Gayrimenkul Danışmanı",
          agency: applicationAgency,
          agencyId,
          slug, status: "approved", approvedAt: new Date(),
        },
      });
      await prisma.agentApplication.update({ where: { id }, data: { status: "activated", agentId: agent.id } });
      await notifyAgent(agent.id, { type: "system", title: "Hesabınız aktif", body: "Danışman hesabınız açıldı. Giriş yapıp ilan ekleyebilirsiniz.", link: "/emlakci/panel" });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Geçersiz işlem" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
