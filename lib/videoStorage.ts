import path from "path";
import { mkdir, rename, copyFile, unlink } from "fs/promises";
import { getUploadDir } from "./uploads";

// Video DEPOLAMA soyutlaması.
// Bugün: VPS diski (UPLOAD_DIR/videos), /uploads rotasıyla (range destekli) servis edilir.
// R2'ye geçince: yalnızca publishVideo/deleteVideo gövdeleri R2 SDK ile değişir;
// uygulamanın geri kalanı (DB'de tutulan URL, oynatıcı) aynı kalır.

const VIDEO_SUBDIR = "videos";

function videosDir() {
  return path.join(getUploadDir(), VIDEO_SUBDIR);
}

/** Transcode edilmiş yerel dosyaları kalıcı servis konumuna taşır, public URL'leri döner. */
export async function publishVideo(
  id: string,
  localMp4Path: string,
  localPosterPath: string
): Promise<{ videoUrl: string; posterUrl: string }> {
  const dir = videosDir();
  await mkdir(dir, { recursive: true });
  const mp4Dest = path.join(dir, `${id}.mp4`);
  const posterDest = path.join(dir, `${id}.jpg`);

  await moveFile(localMp4Path, mp4Dest);
  await moveFile(localPosterPath, posterDest);

  return {
    videoUrl: `/uploads/${VIDEO_SUBDIR}/${id}.mp4`,
    posterUrl: `/uploads/${VIDEO_SUBDIR}/${id}.jpg`,
  };
}

/** Bir /uploads/videos/<id>.mp4 URL'ine ait video + poster dosyalarını siler (temizlik / R2 göçü). */
export async function deleteVideo(videoUrl: string | null | undefined): Promise<void> {
  if (!videoUrl) return;
  const m = videoUrl.match(/^\/uploads\/videos\/([\w.-]+)\.mp4$/);
  if (!m) return; // yerel video değil (örn. YouTube linki) → dokunma
  const id = m[1];
  const dir = videosDir();
  await unlink(path.join(dir, `${id}.mp4`)).catch(() => {});
  await unlink(path.join(dir, `${id}.jpg`)).catch(() => {});
}

/** Yerel (bizim ürettiğimiz) MP4 mı, yoksa dış embed linki mi? */
export function isLocalVideo(url: string | null | undefined): boolean {
  return !!url && /^\/uploads\/videos\/[\w.-]+\.mp4$/.test(url);
}

// rename hızlıdır ama farklı disk/mount'ta (EXDEV) çalışmaz → copy+unlink fallback.
async function moveFile(src: string, dest: string) {
  try {
    await rename(src, dest);
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === "EXDEV") {
      await copyFile(src, dest);
      await unlink(src).catch(() => {});
    } else {
      throw e;
    }
  }
}
