import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveApiAdmin } from "@/lib/apiAdmin";
import { notifyAgent, notifyUser, notifyMatchingAlerts } from "@/lib/notify";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// İlan onayla/reddet — web approveListing/rejectListing parity (yan etkiler dahil).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await resolveApiAdmin(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const note = body?.note ? String(body.note).trim() : null;

  if (action === "approve") {
    const updated = await prisma.listing.update({
      where: { id },
      data: { moderationStatus: "approved", note: null },
      select: {
        slug: true, agentId: true, userId: true, title: true, status: true,
        // category: notifyMatchingAlerts emlak dışı ilanları elemek için okur.
        category: true,
        propertyType: true, listingType: true, district: true, price: true, areaGross: true, rooms: true,
      },
    });
    if (updated.agentId) {
      await notifyAgent(updated.agentId, { type: "listing_approved", title: "İlanınız onaylandı", body: updated.title, link: "/emlakci/panel" });
    } else if (updated.userId) {
      // Bireysel ilan: sahibi kullanıcı. Web ikiziyle aynı davranış.
      await notifyUser(updated.userId, { type: "listing_approved", title: "İlanınız onaylandı", body: updated.title, link: "/hesabim/ilanlarim" });
    }
    if (updated.status === "active") await notifyMatchingAlerts(updated);
    // Web ikizi revalidateListingSurfaces çağırıyor; bu uç hiç çağırmıyordu, yani
    // mobilden onaylanan ilan ISR cache'i dolayısıyla 5 dakika görünmüyordu.
    revalidatePath("/ilanlar");
    revalidatePath(`/ilan/${updated.slug}`);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const updated = await prisma.listing.update({
      where: { id },
      data: { moderationStatus: "rejected", note },
      select: { slug: true, agentId: true, userId: true, title: true },
    });
    if (updated.agentId) {
      await notifyAgent(updated.agentId, {
        type: "listing_rejected",
        title: "İlanınız reddedildi",
        body: note ? `${updated.title} — ${note}` : updated.title,
        link: "/emlakci/panel",
      });
    } else if (updated.userId) {
      await notifyUser(updated.userId, {
        type: "listing_rejected",
        title: "İlanınız reddedildi",
        body: note ? `${updated.title} — ${note}` : updated.title,
        link: "/hesabim/ilanlarim",
      });
    }
    revalidatePath("/ilanlar");
    revalidatePath(`/ilan/${updated.slug}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Geçersiz işlem" }, { status: 400 });
}
