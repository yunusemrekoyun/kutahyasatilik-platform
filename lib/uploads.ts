import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import sharp from "sharp";

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_WIDTH = 1920; // ana görsel (detay/galeri) maksimum genişlik
const WEBP_QUALITY = 82;
const THUMB_WIDTH = 800; // kart/önizleme küçük varyant
const THUMB_QUALITY = 70;

// Yüklenen dosyaları işler ve URL'lerini döner.
// sharp ile decode + re-encode: bozuk/zararlı payload nötralize edilir (güvenlik),
// EXIF dönüşü uygulanır, metadata temizlenir, boyut küçültülür, WebP'ye optimize edilir.
// maxFiles / maxSize çağrı bağlamına göre değişir (admin geniş, satıcı dar).
export async function saveImageFiles(
  files: File[],
  opts: { maxFiles: number; maxSize: number }
): Promise<string[]> {
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files.slice(0, opts.maxFiles)) {
    if (!ALLOWED_TYPES.includes(file.type)) continue;
    if (file.size > opts.maxSize) continue;
    const input = Buffer.from(await file.arrayBuffer());

    // Tek decode, iki çıktı: ana (detay/galeri) + thumb (kart). Re-encode güvenlik
    // (zararlı payload nötralize) + EXIF düzeltme + WebP optimizasyon sağlar.
    let mainBuf: Buffer;
    let thumbBuf: Buffer;
    try {
      const img = sharp(input, { failOn: "error" }).rotate();
      [mainBuf, thumbBuf] = await Promise.all([
        img.clone()
          .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: "inside", withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer(),
        img.clone()
          .resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
          .webp({ quality: THUMB_QUALITY })
          .toBuffer(),
      ]);
    } catch {
      continue; // sağlam/gerçek bir görsel değilse atla
    }

    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeFile(path.join(uploadDir, `${base}.webp`), mainBuf);
    await writeFile(path.join(uploadDir, `${base}-thumb.webp`), thumbBuf);
    urls.push(`/uploads/${base}.webp`);
  }
  return urls;
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
