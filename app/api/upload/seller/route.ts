import { NextRequest, NextResponse } from "next/server";
import { saveImageFiles } from "@/lib/uploads";
import { checkRate } from "@/lib/rateLimit";

// Satıcı formu için PUBLIC (anonim) upload — bilinçli olarak dar limitli:
// daha az dosya, daha küçük boyut ve sıkı IP rate-limit ile disk doldurma riski sınırlanır.
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 6;

export async function POST(req: NextRequest) {
  // 10 dakikada en fazla 5 yükleme isteği / IP.
  const limited = await checkRate(req, "upload_seller", 5, 600_000);
  if (limited) return limited;
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "Dosya yok" }, { status: 400 });
    }

    const urls = await saveImageFiles(files, { maxFiles: MAX_FILES, maxSize: MAX_SIZE });
    if (urls.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Geçerli görsel yüklenemedi (JPG/PNG/WebP/GIF, maks 5MB)" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, urls });
  } catch {
    return NextResponse.json({ ok: false, error: "Yükleme hatası" }, { status: 500 });
  }
}
