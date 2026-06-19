import { spawn } from "child_process";
import path from "path";
import os from "os";
import { mkdtemp, rm } from "fs/promises";

// Video İŞLEME (ffmpeg) — yalnızca arka plan transcode kullanır.
// Telefon/HEVC/.mov dahil her girdiyi web-uyumlu MP4'e (H.264/AAC, faststart) çevirir
// + poster üretir. Çıktı en çok 1080p (HD/FullHD), en-boy korunur.

class FfmpegMissingError extends Error {
  constructor() {
    super("ffmpeg sunucuda kurulu değil. Kurulum: apt install -y ffmpeg");
    this.name = "FfmpegMissingError";
  }
}

// Eşzamanlı transcode sınırı — mütevazı VPS'i (KVM2: 2 vCPU) doyurmamak için.
// ffmpeg zaten çok-çekirdek kullanır; varsayılan 1 (sıralı). VIDEO_CONCURRENCY ile artırılır.
const MAX_CONCURRENT_TRANSCODE = Math.max(1, Number(process.env.VIDEO_CONCURRENCY) || 1);
let activeTranscodes = 0;
const transcodeQueue: Array<() => void> = [];

function acquireTranscodeSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeTranscodes < MAX_CONCURRENT_TRANSCODE) {
      activeTranscodes++;
      resolve();
    } else {
      transcodeQueue.push(() => {
        activeTranscodes++;
        resolve();
      });
    }
  });
}

function releaseTranscodeSlot() {
  activeTranscodes = Math.max(0, activeTranscodes - 1);
  const next = transcodeQueue.shift();
  if (next) next();
}

/** Transcode'u eşzamanlılık sınırı içinde çalıştırır; slot doluysa kuyrukta bekler. */
export async function withTranscodeSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireTranscodeSlot();
  try {
    return await fn();
  } finally {
    releaseTranscodeSlot();
  }
}

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stderr = "";
    let stdout = "";
    proc.stdout?.on("data", (d) => (stdout += d.toString()));
    proc.stderr?.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (e) => {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") reject(new FfmpegMissingError());
      else reject(e);
    });
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout || stderr);
      else reject(new Error(`${cmd} çıkış kodu ${code}: ${stderr.slice(-500)}`));
    });
  });
}

/** Girdi süresini saniye olarak döner (ffprobe). */
export async function probeDuration(input: string): Promise<number> {
  const out = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1",
    input,
  ]);
  const sec = parseFloat(out.trim());
  return Number.isFinite(sec) ? sec : 0;
}

/**
 * Girdi videoyu web-MP4 + poster'a çevirir. Geçici klasöre yazar, yollarını döner.
 * Çağıran taraf publishVideo ile kalıcı konuma taşır ve geçici klasörü temizler.
 */
export async function transcodeToWeb(
  input: string,
  id: string
): Promise<{ workDir: string; mp4Path: string; posterPath: string; duration: number }> {
  const duration = await probeDuration(input).catch(() => 0);

  const workDir = await mkdtemp(path.join(os.tmpdir(), `vid-${id}-`));
  const mp4Path = path.join(workDir, `${id}.mp4`);
  const posterPath = path.join(workDir, `${id}.jpg`);

  // 1080p tavanı, en-boy korunur, çift boyut (yuv420p geniş uyumluluk), faststart (anında oynar)
  await run("ffmpeg", [
    "-y", "-i", input,
    "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    mp4Path,
  ]);

  // Poster: 1. saniyeden tek kare
  await run("ffmpeg", ["-y", "-ss", "1", "-i", mp4Path, "-frames:v", "1", "-q:v", "3", posterPath]);

  return { workDir, mp4Path, posterPath, duration };
}

export async function cleanupWorkDir(workDir: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true }).catch(() => {});
}

export { FfmpegMissingError };
