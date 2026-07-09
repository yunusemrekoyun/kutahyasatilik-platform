import "server-only";
import { getUserSession } from "@/lib/userAuth";
import { getAgentSession } from "@/lib/agentAuth";

// Mesajlaşma katılımcısı: cookie oturumundan kullanıcı VEYA emlakçı çözülür.
export type Participant = { role: "user" | "agent"; id: string };

export async function getMessagingParticipant(): Promise<Participant | null> {
  const u = await getUserSession();
  if (u) return { role: "user", id: u.userId };
  const a = await getAgentSession();
  if (a) return { role: "agent", id: a.agentId };
  return null;
}
