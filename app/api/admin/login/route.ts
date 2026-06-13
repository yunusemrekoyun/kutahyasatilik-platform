import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth";
import { checkRate } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "admin-login", 15, 300_000);
  if (limited) return limited;
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "E-posta ve şifre gerekli" }, { status: 400 });
    }
    const admin = await verifyCredentials(String(email), String(password));
    if (!admin) {
      return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı" }, { status: 401 });
    }
    await createSession({ adminId: admin.id, email: admin.email });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Giriş hatası" }, { status: 500 });
  }
}
