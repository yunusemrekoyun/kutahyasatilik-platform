import { NextResponse } from "next/server";
import { destroyAgentSession } from "@/lib/agentAuth";

export async function POST() {
  await destroyAgentSession();
  return NextResponse.json({ ok: true });
}
