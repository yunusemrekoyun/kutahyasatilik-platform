import { NextRequest, NextResponse } from "next/server";
import { saveImageFiles } from "@/lib/imageProcessing";
import { absolutizeUrl } from "@/lib/apiMedia";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Satıcı formu foto yükleme — web /api/upload/seller'ın Bearer/mobil karşılığı.
// Web ile aynı dar limit (az dosya, küçük boyut, sıkı IP rate-limit). Public
// (web tarafı da public); dönen url'ler mobil önizleme için mutlaklaştırılır.
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
    return NextResponse.json({ ok: true, urls: urls.map((u) => absolutizeUrl(u, req)) });
  } catch {
    return NextResponse.json({ ok: false, error: "Yükleme hatası" }, { status: 500 });
  }
}
