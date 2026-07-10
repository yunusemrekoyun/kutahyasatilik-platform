import "server-only";
import { getUserSession } from "@/lib/userAuth";
import { getAgentSession } from "@/lib/agentAuth";
import { resolveApiSession } from "@/lib/apiAuth";

// Mesajlaşma katılımcısı: cookie oturumundan kullanıcı VEYA emlakçı çözülür.
export type Participant = { role: "user" | "agent"; id: string };

export async function getMessagingParticipant(): Promise<Participant | null> {
  const u = await getUserSession();
  if (u) return { role: "user", id: u.userId };
  const a = await getAgentSession();
  if (a) return { role: "agent", id: a.agentId };
  return null;
}

// Mobil (Bearer) katılımcı — /api/v1/messages* için. Admin mesajlaşmaz (null).
export async function getApiMessagingParticipant(req: Request): Promise<Participant | null> {
  const s = await resolveApiSession(req);
  if (s?.role === "user") return { role: "user", id: s.id };
  if (s?.role === "agent") return { role: "agent", id: s.id };
  return null;
}
