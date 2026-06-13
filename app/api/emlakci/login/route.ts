import { NextRequest, NextResponse } from "next/server";
import { verifyAgentCredentials, createAgentSession } from "@/lib/agentAuth";
import { checkRate } from "@/lib/rateLimit";

const STATUS_MESSAGE: Record<string, string> = {
  pending: "Başvurunuz henüz onaylanmadı. Onaylandığında e-posta/telefon ile bilgilendirileceksiniz.",
  rejected: "Başvurunuz onaylanmadı. Bilgi için bizimle iletişime geçin.",
  suspended: "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin.",
};

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "agent-login", 15, 300_000);
  if (limited) return limited;
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "E-posta ve şifre gerekli" }, { status: 400 });
    }
    const agent = await verifyAgentCredentials(String(email), String(password));
    if (!agent) {
      return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı" }, { status: 401 });
    }
    if (agent.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: STATUS_MESSAGE[agent.status] || "Hesabınız aktif değil." },
        { status: 403 }
      );
    }
    await createAgentSession({ agentId: agent.id, email: agent.email, name: agent.name });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Giriş hatası" }, { status: 500 });
  }
}
