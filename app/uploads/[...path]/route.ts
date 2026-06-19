import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { getContentType, resolveUploadPath } from "@/lib/uploads";

export const runtime = "nodejs";

// Görsel + video servis rotası. Video için HTTP Range (206) desteklenir:
// ileri-geri sarma çalışır ve dosya tamamı belleğe alınmaz (createReadStream).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = resolveUploadPath(path || []);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  let size: number;
  try {
    const info = await stat(/* turbopackIgnore: true */ filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = getContentType(filePath);
  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  const range = req.headers.get("range");

  // Range isteği → 206 Partial Content (oynatıcı sarma için kullanır)
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start > end || start >= size) {
        return new NextResponse("Range Not Satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
        });
      }
      const nodeStream = createReadStream(/* turbopackIgnore: true */ filePath, { start, end });
      return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
  }

  // Range yoksa → tüm dosya, yine stream ile (büyük videoyu belleğe yığmadan)
  const nodeStream = createReadStream(/* turbopackIgnore: true */ filePath);
  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}
