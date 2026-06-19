import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notify";

const schema = z.object({
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  company: z.string().max(160).optional().or(z.literal("")),
  phone: trPhoneSchema,
  email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  website: z.string().max(200).optional(), // honeypot — insan boş bırakır
});

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "ad-request", 5, 60_000);
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

  // Honeypot dolu → bot. Sahte başarı dön (kaydetme).
  if (data.website) return NextResponse.json({ ok: true });

  await prisma.adRequest.create({
    data: {
      name: data.name.trim(),
      company: data.company || null,
      phone: data.phone.trim(),
      email: data.email || null,
      message: data.message || null,
    },
  });

  await notifyAdmins({
    type: "ad_request",
    title: "Yeni reklam talebi",
    body: `${data.name.trim()}${data.company ? ` · ${data.company}` : ""}`,
    link: "/admin/reklam-talepleri",
  });

  return NextResponse.json({ ok: true });
}
