import path from "path";
import { writeFile, mkdir } from "fs/promises";
import sharp from "sharp";
import { getUploadDir } from "./uploads";

// Görsel İŞLEME (sharp) — yalnızca upload rotaları kullanır.
// Servis/silme yolundan AYRIDIR: /uploads servis rotası sharp'a bağımlı olmamalı
// (sharp native binary yüklenemese bile görseller servis edilebilsin diye).

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

    // Tek decode, iki çıktı: ana (detay/galeri) + thumb (kart).
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
