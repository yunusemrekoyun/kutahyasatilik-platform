import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRate } from "@/lib/rateLimit";
import { verifyCredentials, createSession } from "@/lib/auth";
import { verifyAgentCredentials, createAgentSession } from "@/lib/agentAuth";
import { verifyUserCredentials, createUserSession } from "@/lib/userAuth";

// BİRLEŞİK GİRİŞ: tek e-posta+şifre formu. Rol otomatik algılanır — admin → emlakçı → kullanıcı
// sırasıyla denenir, eşleşen silonun KENDİ oturumu (cookie'si) kurulur. Böylece üç ayrı login
// sayfası tek kapıda toplanır; çapraz-silo koruması (her silo ayrı cookie/claim) aynen korunur.
// E-posta pratikte yalnız bir siloda olduğundan tek bcrypt karşılaştırması yeterli olur.

const AGENT_STATUS_MESSAGE: Record<string, string> = {
  pending: "Başvurunuz henüz onaylanmadı. Onaylandığında e-posta/telefon ile bilgilendirileceksiniz.",
  rejected: "Başvurunuz onaylanmadı. Bilgi için bizimle iletişime geçin.",
  suspended: "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin.",
};

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin").max(160),
  password: z.string().min(1, "Şifre gerekli").max(100),
  // nullish: istemci ?next yokken null gönderebiliyor — optional() null'ı reddedip
  // girişi tamamen kilitliyordu ("expected string, received null").
  next: z.string().max(512).nullish(),
});

// Açık-yönlendirme koruması: yalnız site-içi, tek '/' ile başlayan yol. '//' veya '/\' reddedilir.
function safePath(raw?: string | null): string | null {
  return raw && /^\/[^/\\]/.test(raw) ? raw : null;
}

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "auth-login", 15, 300_000);
  if (limited) return limited;

  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: err.issues[0]?.message || "Form hatalı" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }
  const next = safePath(data.next);

  // 1) Admin
  const admin = await verifyCredentials(data.email, data.password);
  if (admin) {
    await createSession({ adminId: admin.id, email: admin.email });
    const dest = next && next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin";
    return NextResponse.json({ ok: true, role: "admin", redirect: dest });
  }

  // 2) Emlakçı (onay durumu kapısı korunur)
  const agent = await verifyAgentCredentials(data.email, data.password);
  if (agent) {
    if (agent.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: AGENT_STATUS_MESSAGE[agent.status] || "Hesabınız aktif değil." },
        { status: 403 }
      );
    }
    await createAgentSession({ agentId: agent.id, email: agent.email, name: agent.name });
    const dest = next && next.startsWith("/emlakci/panel") ? next : "/emlakci/panel";
    return NextResponse.json({ ok: true, role: "agent", redirect: dest });
  }

  // 3) Kullanıcı (panel/admin yollarına yönlenmesin — erişemez)
  const user = await verifyUserCredentials(data.email, data.password);
  if (user) {
    await createUserSession({ userId: user.id, email: user.email, name: user.name });
    const dest = next && !next.startsWith("/admin") && !next.startsWith("/emlakci") ? next : "/hesabim";
    return NextResponse.json({ ok: true, role: "user", redirect: dest });
  }

  return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı." }, { status: 401 });
}
