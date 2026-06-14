import path from "path";
import { unlink } from "fs/promises";

// Upload SERVİS + yol yardımcıları. Bilinçli olarak sharp İÇERMEZ:
// /uploads servis rotası ve silme akışları sharp native binary'sine bağımlı olmamalı.
// Görsel işleme (sharp) ayrı: lib/imageProcessing.ts.

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

// Verilen /uploads/* URL'lerine ait fiziksel dosyaları siler (disk şişmesini önler).
// Yalnızca kendi upload klasörümüzdeki dosyalara dokunur; dış URL'leri yok sayar.
export async function deleteUploadFiles(urls: (string | null | undefined)[]): Promise<void> {
  for (const url of urls) {
    if (!url) continue;
    const m = url.match(/^\/uploads\/(.+)$/);
    if (!m) continue;
    // ana dosya + thumb varyantı
    const names = [m[1]];
    if (m[1].endsWith(".webp")) names.push(m[1].replace(/\.webp$/, "-thumb.webp"));
    for (const n of names) {
      const target = resolveUploadPath([n]);
      if (target) await unlink(target).catch(() => {});
    }
  }
}

export function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

export function resolveUploadPath(parts: string[]) {
  const uploadDir = path.resolve(getUploadDir());
  const filePath = path.resolve(uploadDir, ...parts);
  if (filePath !== uploadDir && filePath.startsWith(`${uploadDir}${path.sep}`)) {
    return filePath;
  }
  return null;
}
