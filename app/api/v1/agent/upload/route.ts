import { NextRequest, NextResponse } from "next/server";
import { saveImageFiles } from "@/lib/imageProcessing";
import { resolveApiAgent } from "@/lib/apiAgent";
import { absolutizeUrl } from "@/lib/apiMedia";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_FILES = 15;

// İlan görseli yükleme (web /api/upload'un Bearer karşılığı; aynı saveImageFiles → webp+thumb).
// Dönen url'ler GÖRSEL ÖNİZLEME için mutlaklaştırılır; ilan create/update'inde geri gönderilir.
export async function POST(req: NextRequest) {
  const a = await resolveApiAgent(req);
  if (!a.ok) return NextResponse.json({ ok: false, error: a.error }, { status: a.status });

  const limited = await checkRate(req, "upload", 30, 60_000);
  if (limited) return limited;

  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ ok: false, error: "Dosya yok" }, { status: 400 });

    const urls = await saveImageFiles(files, { maxFiles: MAX_FILES, maxSize: MAX_SIZE });
    if (urls.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Geçerli görsel yüklenemedi (JPG/PNG/WebP/GIF, maks 8MB)" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, urls: urls.map((u) => absolutizeUrl(u, req)) });
  } catch {
    return NextResponse.json({ ok: false, error: "Yükleme hatası" }, { status: 500 });
  }
}
