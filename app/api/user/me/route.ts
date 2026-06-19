import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Header gibi client bileşenler oturum durumunu buradan öğrenir (layout statik kalsın diye).
export async function GET() {
  const session = await getUserSession();
  return NextResponse.json({ ok: true, user: session ? { name: session.name, email: session.email } : null });
}
