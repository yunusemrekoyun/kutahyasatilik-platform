import { NextRequest, NextResponse } from "next/server";
import { open, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import os from "os";
import { getSession } from "@/lib/auth";
import { getAgentSession } from "@/lib/agentAuth";
import { checkRate } from "@/lib/rateLimit";
import { createJob, updateJob } from "@/lib/videoJobs";
import { transcodeToWeb, cleanupWorkDir, withTranscodeSlot } from "@/lib/videoProcessing";
import { publishVideo } from "@/lib/videoStorage";

export const runtime = "nodejs"; // ffmpeg + fs (edge değil)

const MAX_TOTAL = 1024 * 1024 * 1024; // 1GB ham tavan
const MAX_CHUNK = 80 * 1024 * 1024; // tek parça güvenlik tavanı (istemci 50MB gönderir)

function partPath(uploadId: string) {
  return path.join(os.tmpdir(), `vidup-${uploadId}.part`);
}

async function isAuthenticated(): Promise<boolean> {
  const [admin, agent] = await Promise.all([getSession(), getAgentSession()]);
  return Boolean(admin || agent);
}

// Arka plan: transcode → kalıcı konuma yayınla → job güncelle. İSTEK BEKLEMEZ.
async function processInBackground(id: string, inputPath: string) {
  try {
    // Eşzamanlılık sınırı: slot boşalana dek kuyrukta bekler (VPS'i doyurmaz).
    const { workDir, mp4Path, posterPath } = await withTranscodeSlot(async () => {
      updateJob(id, { progress: 25 });
      return transcodeToWeb(inputPath, id);
    });
    updateJob(id, { progress: 85 });
    const { videoUrl, posterUrl } = await publishVideo(id, mp4Path, posterPath);
    updateJob(id, { status: "ready", progress: 100, videoUrl, posterUrl });
    await cleanupWorkDir(workDir);
  } catch (e) {
    updateJob(id, { status: "error", error: e instanceof Error ? e.message : "İşleme hatası" });
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const limited = await checkRate(req, "video-upload", 300, 60_000); // çok parça → bol limit
  if (limited) return limited;

  try {
    const form = await req.formData();
    const uploadId = String(form.get("uploadId") || "");
    const index = Number(form.get("index"));
    const total = Number(form.get("total"));
    const offset = Number(form.get("offset"));
    const fileName = String(form.get("fileName") || "video").slice(0, 200);
    const chunk = form.get("chunk");

    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(uploadId)) {
      return NextResponse.json({ ok: false, error: "Geçersiz oturum" }, { status: 400 });
    }
    if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1 || index < 0 || index >= total) {
      return NextResponse.json({ ok: false, error: "Geçersiz parça" }, { status: 400 });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json({ ok: false, error: "Geçersiz konum" }, { status: 400 });
    }
    if (!(chunk instanceof File) || chunk.size === 0) {
      return NextResponse.json({ ok: false, error: "Parça yok" }, { status: 400 });
    }
    if (chunk.size > MAX_CHUNK || offset + chunk.size > MAX_TOTAL) {
      return NextResponse.json({ ok: false, error: "Video 1GB'tan büyük olamaz" }, { status: 400 });
    }

    const pp = partPath(uploadId);
    const buf = Buffer.from(await chunk.arrayBuffer());
    // Konum-bazlı yazma → aynı parçanın tekrarı güvenli (idempotent / resumable).
    const fh = await open(pp, index === 0 ? "w" : "r+");
    try {
      await fh.write(buf, 0, buf.length, offset);
    } finally {
      await fh.close();
    }

    // Son parça değilse: onayla, devam et
    if (index < total - 1) {
      return NextResponse.json({ ok: true, received: index });
    }

    // Son parça: birleşik dosya hazır → job başlat, arka planda işle
    const id = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
    createJob(id, fileName);
    void processInBackground(id, pp); // pp = birleşmiş ham dosya (işlem sonunda silinir)

    return NextResponse.json({ ok: true, jobId: id });
  } catch {
    return NextResponse.json({ ok: false, error: "Yükleme hatası" }, { status: 500 });
  }
}
