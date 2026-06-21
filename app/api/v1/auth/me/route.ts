import { NextRequest, NextResponse } from "next/server";
import { resolveApiSession } from "@/lib/apiAuth";

// Mevcut oturumu döner (Bearer veya cookie). Mobil, token geçerliliğini doğrulamak
// ve role'e göre yönlenmek için kullanır.
export async function GET(req: NextRequest) {
  const session = await resolveApiSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    role: session.role,
    id: session.id,
    email: session.email,
    name: session.name ?? null,
  });
}
