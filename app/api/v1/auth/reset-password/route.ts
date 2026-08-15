import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRate } from "@/lib/rateLimit";
import { applyNewPassword, resolveResetToken } from "@/lib/passwordReset";
import { hashPassword } from "@/lib/userAuth";
import { PASSWORD_ERROR, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/passwordPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil şifre sıfırlama tamamlama — web /api/user/reset-password birebir port. PUBLIC.
// (Ana akış e-postadaki WEB linkiyle tamamlanır; bu twin ileride native/webview reset için hazır.)
const schema = z.object({
  token: z.string().min(16, "Geçersiz bağlantı").max(200),
  password: z.string().min(PASSWORD_MIN_LENGTH, PASSWORD_ERROR).max(PASSWORD_MAX_LENGTH),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "reset-password", 10, 15 * 60_000);
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

  const resolved = await resolveResetToken(data.token);
  if (!resolved.ok) {
    return NextResponse.json(
      { ok: false, error: "Bağlantı geçersiz veya süresi dolmuş. Yeniden şifre sıfırlama isteyin." },
      { status: 400 }
    );
  }

  await applyNewPassword(resolved.audience, resolved.id, await hashPassword(data.password));

  return NextResponse.json({ ok: true });
}
