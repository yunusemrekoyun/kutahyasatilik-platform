import { readFile, stat } from "fs/promises";
import { NextResponse } from "next/server";
import { getContentType, resolveUploadPath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = resolveUploadPath(path || []);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  try {
    const info = await stat(/* turbopackIgnore: true */ filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

    const body = await readFile(/* turbopackIgnore: true */ filePath);
    return new NextResponse(body, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
