import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Header gibi client bileşenler oturum durumunu buradan öğrenir (layout statik kalsın diye).
// phone DB'den gelir (token'da yok) — talep formlarının ön-doldurması için.
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: true, user: null });

  let phone: string | null = null;
  let name = session.name;
  try {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, phone: true },
    });
    if (u) {
      name = u.name;
      phone = u.phone;
    }
  } catch {
    /* DB erişilemezse token bilgisiyle yetin */
  }
  return NextResponse.json({ ok: true, user: { name, email: session.email, phone } });
}
