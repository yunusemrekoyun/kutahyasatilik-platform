import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mobil danışman BAŞVURUSU — web /api/emlakci/register birebir port. PUBLIC (Bearer YOK).
// Hesap AÇMAZ; AgentApplication oluşturur. Admin inceler → teklif → aktivasyonda Agent oluşur.
const schema = z.object({
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  email: z.string().email("Geçerli bir e-posta girin").max(160),
  phone: trPhoneSchema,
  title: z.string().max(80).optional(),
  agency: z.string().max(120).optional(),
  experience: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "agent-register", 5, 3_600_000);
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

  const email = data.email.toLowerCase();
  const [agentExists, appExists] = await Promise.all([
    prisma.agent.findUnique({ where: { email }, select: { id: true } }),
    prisma.agentApplication.findFirst({
      where: { email, status: { notIn: ["rejected", "activated"] } },
      select: { id: true },
    }),
  ]);
  if (agentExists) {
    return NextResponse.json({ ok: false, error: "Bu e-posta zaten kayıtlı bir danışmana ait." }, { status: 409 });
  }
  if (appExists) {
    return NextResponse.json({ ok: false, error: "Bu e-posta ile bekleyen bir başvuru zaten var." }, { status: 409 });
  }

  await prisma.agentApplication.create({
    data: {
      name: data.name.trim(),
      email,
      phone: data.phone.trim(),
      title: data.title?.trim() || null,
      agency: data.agency?.trim() || null,
      experience: data.experience?.trim() || null,
    },
  });

  await notifyAdmins({
    type: "agent_application",
    title: "Yeni danışman başvurusu",
    body: `${data.name.trim()} · ${data.phone.trim()}`,
    link: "/admin/basvurular",
  });

  return NextResponse.json({ ok: true });
}
