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

/* ---------------------------------------------------------------------------
 * Sohbet tarafı çözümü
 *
 * Satıcı tarafı iki türlü olabilir: onaylı danışman (`agentId`) ya da bireysel
 * ilan sahibi (`ownerUserId`). Bu yüzden yetki artık KATILIMCI ROLÜNDEN değil,
 * SOHBET BAZINDA çözülüyor: aynı kullanıcı bir sohbette alıcı, başkasında
 * satıcı olabilir.
 *
 * Eski kod `me.role === "user" ? conv.userId !== me.id : conv.agentId !== me.id`
 * yazıyordu; bireysel satıcı bu kontrolden hiçbir zaman geçemezdi.
 * ------------------------------------------------------------------------- */

export type ConversationSides = {
  userId: string;
  agentId: string | null;
  ownerUserId: string | null;
};

export type Side = "buyer" | "seller";

/** Katılımcının bu sohbetteki tarafı; taraf değilse null (→ 404). */
export function conversationSide(conv: ConversationSides, me: Participant): Side | null {
  if (me.role === "user") {
    if (conv.userId === me.id) return "buyer";
    if (conv.ownerUserId && conv.ownerUserId === me.id) return "seller";
    return null;
  }
  return conv.agentId && conv.agentId === me.id ? "seller" : null;
}

/**
 * `Message.senderRole` değeri.
 * - "user"  alıcı
 * - "agent" satıcı (danışman)  — mevcut satırlarla uyumlu
 * - "owner" satıcı (bireysel)  — yalnız yeni bireysel sohbetlerde
 */
export function senderRoleFor(me: Participant, side: Side): "user" | "agent" | "owner" {
  if (side === "buyer") return "user";
  return me.role === "agent" ? "agent" : "owner";
}

/** Bir mesaj satıcı tarafından mı gönderilmiş? */
export function isSellerMessage(senderRole: string): boolean {
  return senderRole === "agent" || senderRole === "owner";
}

/** Mesaj bu tarafa mı ait (UI'da "benim balonum")? */
export function isOwnMessage(senderRole: string, side: Side): boolean {
  return side === "seller" ? isSellerMessage(senderRole) : senderRole === "user";
}

/** Okundu damgası: alıcı `userReadAt`, satıcı (her iki tür) `agentReadAt`. */
export function readAtField(side: Side): "userReadAt" | "agentReadAt" {
  return side === "buyer" ? "userReadAt" : "agentReadAt";
}

/** Katılımcının sohbetlerini bulan where — alıcı VE satıcı olduğu sohbetlerin ikisi de. */
export function conversationsWhereFor(me: Participant) {
  if (me.role === "agent") return { agentId: me.id };
  return { OR: [{ userId: me.id }, { ownerUserId: me.id }] };
}
