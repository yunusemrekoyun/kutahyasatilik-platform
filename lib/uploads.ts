import path from "path";
import { writeFile, mkdir } from "fs/promises";

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function safeExt(type: string): string {
  switch (type) {
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    default: return ".jpg";
  }
}

// Dosya imzası (magic bytes) gerçekten görsel mi? — sahte MIME'a karşı savunma
function isRealImage(b: Buffer, type: string): boolean {
  if (b.length < 12) return false;
  switch (type) {
    case "image/jpeg": return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png": return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case "image/gif": return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
    case "image/webp": return b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
    default: return false;
  }
}

// Yüklenen dosyaları doğrular (tip, boyut, imza), diske yazar ve URL'lerini döner.
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
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isRealImage(buffer, file.type)) continue; // imza uyuşmuyorsa atla
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt(file.type)}`;
    await writeFile(path.join(uploadDir, name), buffer);
    urls.push(`/uploads/${name}`);
  }
  return urls;
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
