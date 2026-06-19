import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isApprovedAgentSession } from "@/lib/agentAuth";
import { getJob } from "@/lib/videoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const [admin, approvedAgent] = await Promise.all([getSession(), isApprovedAgentSession()]);
  if (!admin && !approvedAgent) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id gerekli" }, { status: 400 });

  const job = getJob(id);
  if (!job) return NextResponse.json({ ok: false, error: "Bulunamadı" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    status: job.status,
    progress: job.progress,
    videoUrl: job.videoUrl ?? null,
    posterUrl: job.posterUrl ?? null,
    error: job.error ?? null,
  });
}
