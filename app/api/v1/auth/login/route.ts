import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRate } from "@/lib/rateLimit";
import { signSessionToken } from "@/lib/apiAuth";
import { verifyUserCredentials } from "@/lib/userAuth";
import { verifyAgentCredentials } from "@/lib/agentAuth";
import { verifyCredentials } from "@/lib/auth";

// Mobil TEK login. Backend 3 siloyu sırayla dener (user → agent → admin) ve eşleşen
// ilk silonun token'ını döner. Token silo-özeldir (çapraz-silo fix korunur); cookie
// SET ETMEZ — mobil token'ı Bearer olarak saklar.
// Web'in kendi cookie tabanlı login route'ları (/api/user|emlakci|admin/login) aynen durur.

const schema = z.object({
  identifier: z.string().min(1, "E-posta gerekli").max(160),
  password: z.string().min(1, "Şifre gerekli").max(100),
});

// Emlakçı login durum mesajları — /api/emlakci/login ile aynı.
const AGENT_STATUS_MESSAGE: Record<string, string> = {
  pending: "Başvurunuz henüz onaylanmadı. Onaylandığında e-posta/telefon ile bilgilendirileceksiniz.",
  rejected: "Başvurunuz onaylanmadı. Bilgi için bizimle iletişime geçin.",
  suspended: "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin.",
};

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "v1-login", 10, 60_000);
  if (limited) return limited;

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  const { identifier, password } = data;

  try {
    // 1) Standart kullanıcı (en yaygın)
    const user = await verifyUserCredentials(identifier, password);
    if (user) {
      const token = await signSessionToken(
        { userId: user.id, email: user.email, name: user.name },
        "30d"
      );
      return NextResponse.json({ ok: true, token, role: "user" });
    }

    // 2) Emlakçı — yalnız onaylıysa token verilir
    const agent = await verifyAgentCredentials(identifier, password);
    if (agent) {
      if (agent.status !== "approved") {
        return NextResponse.json(
          { ok: false, error: AGENT_STATUS_MESSAGE[agent.status] || "Hesabınız aktif değil." },
          { status: 403 }
        );
      }
      const token = await signSessionToken(
        { agentId: agent.id, email: agent.email, name: agent.name },
        "7d"
      );
      return NextResponse.json({ ok: true, token, role: "agent" });
    }

    // 3) Admin
    const admin = await verifyCredentials(identifier, password);
    if (admin) {
      const token = await signSessionToken({ adminId: admin.id, email: admin.email }, "7d");
      return NextResponse.json({ ok: true, token, role: "admin" });
    }

    return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı." }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Giriş hatası" }, { status: 500 });
  }
}
