import { NextRequest, NextResponse } from "next/server";
import { saveImageFiles } from "@/lib/imageProcessing";
import { getSession } from "@/lib/auth";
import { isApprovedAgentSession } from "@/lib/agentAuth";
import { checkRate } from "@/lib/rateLimit";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_FILES = 15;

// Yalnızca admin veya ONAYLI emlakçı yükleyebilir (anonim + askıya alınmış emlakçıyı kapatır).
async function isAuthenticated(): Promise<boolean> {
  const [admin, approvedAgent] = await Promise.all([getSession(), isApprovedAgentSession()]);
  return Boolean(admin || approvedAgent);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const limited = await checkRate(req, "upload", 30, 60_000);
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
        { ok: false, error: "Geçerli görsel yüklenemedi (JPG/PNG/WebP/GIF, maks 8MB)" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, urls });
  } catch {
    return NextResponse.json({ ok: false, error: "Yükleme hatası" }, { status: 500 });
  }
}
