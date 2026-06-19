import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { checkRate } from "@/lib/rateLimit";
import { trPhoneSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notify";

const schema = z.object({
  name: z.string().min(2, "Ad soyad gerekli").max(120),
  email: z.string().email("Geçerli bir e-posta girin").max(160),
  phone: trPhoneSchema,
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(100),
  title: z.string().max(80).optional(),
  agency: z.string().max(120).optional(),
});

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "danisman";
  let slug = root;
  let i = 1;
  while (await prisma.agent.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  const limited = await checkRate(req, "agent-register", 5, 3_600_000);
  if (limited) return limited;
  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0]?.message || "Form hatalı" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
  }

  const email = data.email.toLowerCase();
  const exists = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "Bu e-posta ile zaten bir başvuru var." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const slug = await uniqueSlug(data.name);

  await prisma.agent.create({
    data: {
      email,
      passwordHash,
      name: data.name.trim(),
      phone: data.phone.trim(),
      title: data.title?.trim() || "Gayrimenkul Danışmanı",
      agency: data.agency?.trim() || null,
      slug,
      status: "pending",
    },
  });

  await notifyAdmins({
    type: "agent_application",
    title: "Yeni danışman başvurusu",
    body: `${data.name.trim()} · ${data.phone.trim()}`,
    link: "/admin/emlakcilar",
  });

  return NextResponse.json({ ok: true });
}
