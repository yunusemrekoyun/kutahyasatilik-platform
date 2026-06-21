import { prisma } from "@/lib/prisma";
import { resolveApiSession } from "@/lib/apiAuth";

// Bearer/cookie oturumdan ONAYLI emlakçıyı çözer (web lib/agentAuth.requireApprovedAgent eşdeğeri).
// Token 7g geçerli olduğundan agent.status DB'den HER istekte yeniden doğrulanır
// (login sonrası askıya alınma / red ihtimali). role:agent + status:approved şart.
export type AgentResult =
  | { ok: true; agent: { id: string; name: string; email: string } }
  | { ok: false; status: number; error: string };

export async function resolveApiAgent(req: Request): Promise<AgentResult> {
  const session = await resolveApiSession(req);
  if (!session || session.role !== "agent") return { ok: false, status: 401, error: "Yetkisiz" };
  const agent = await prisma.agent.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, status: true },
  });
  if (!agent) return { ok: false, status: 401, error: "Yetkisiz" };
  if (agent.status !== "approved") {
    const msg =
      agent.status === "pending"
        ? "Hesabınız onay bekliyor"
        : agent.status === "suspended"
          ? "Hesabınız askıya alınmış"
          : agent.status === "rejected"
            ? "Başvurunuz reddedilmiş"
            : "Hesabınız onaylı değil";
    return { ok: false, status: 403, error: msg };
  }
  return { ok: true, agent: { id: agent.id, name: agent.name, email: agent.email } };
}
