import path from "path";

// Upload SERVİS + yol yardımcıları. Bilinçli olarak sharp İÇERMEZ:
// /uploads servis rotası ve silme akışları sharp native binary'sine bağımlı olmamalı.
// Görsel işleme (sharp) ayrı: lib/imageProcessing.ts.

export function getUploadDir() {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR);
  }
  return path.join(process.cwd(), "public", "uploads");
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
  const uploadDir = getUploadDir();
  const filePath = path.resolve(/*turbopackIgnore: true*/ uploadDir, ...parts);
  if (filePath !== uploadDir && filePath.startsWith(`${uploadDir}${path.sep}`)) {
    return filePath;
  }
  return null;
}
