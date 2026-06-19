import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRate } from "@/lib/rateLimit";
import { verifyUserCredentials, createUserSession } from "@/lib/userAuth";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta girin").max(160),
  password: z.string().min(1, "Şifre gerekli").max(100),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "user-login", 10, 60_000);
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

  const user = await verifyUserCredentials(data.email, data.password);
  if (!user) {
    return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  await createUserSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ ok: true });
}
