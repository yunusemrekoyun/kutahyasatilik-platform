import "server-only";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { getAgentSession } from "./agentAuth";
import { getUserSession } from "./userAuth";

// Merkezi bildirim yardımcıları. İlk sürüm: site-içi (e-posta katmanı sonra eklenecek).
// notify() çağrıları İKİNCİLDİR: hata olsa bile çağıran akışı (lead/onay vb.) bozmaz.

export type NotificationRole = "user" | "agent" | "admin";

type CreateOpts = {
  recipientRole: NotificationRole;
  recipientId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

export async function notify(opts: CreateOpts): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        recipientRole: opts.recipientRole,
        recipientId: opts.recipientId ?? null,
        type: opts.type,
        title: opts.title,
        body: opts.body ?? null,
        link: opts.link ?? null,
      },
    });
  } catch {
    // Bildirim ikincil — tablo henüz yoksa ya da hata olursa sessizce geç.
  }
}

type RoleOpts = Omit<CreateOpts, "recipientRole" | "recipientId">;

export function notifyAdmins(opts: RoleOpts) {
  return notify({ ...opts, recipientRole: "admin", recipientId: null });
}
export function notifyAgent(agentId: string, opts: RoleOpts) {
  return notify({ ...opts, recipientRole: "agent", recipientId: agentId });
}
export function notifyUser(userId: string, opts: RoleOpts) {
  return notify({ ...opts, recipientRole: "user", recipientId: userId });
}

// --- Listeleme / okuma (alıcı = mevcut aktör) ---

function recipientWhere(role: NotificationRole, recipientId: string | null) {
  // admin kutusu ortak (recipientId null); agent/user kendi id'si.
  if (role === "admin") return { recipientRole: "admin" };
  return { recipientRole: role, recipientId };
}

export async function listNotifications(role: NotificationRole, recipientId: string | null, limit = 20) {
  return prisma.notification.findMany({
    where: recipientWhere(role, recipientId),
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadCount(role: NotificationRole, recipientId: string | null): Promise<number> {
  return prisma.notification.count({ where: { ...recipientWhere(role, recipientId), isRead: false } });
}

export async function markRead(id: string, role: NotificationRole, recipientId: string | null): Promise<void> {
  // updateMany + alıcı filtresi: başkasının bildirimini okundu yapamaz (yetki).
  await prisma.notification.updateMany({
    where: { id, ...recipientWhere(role, recipientId) },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(role: NotificationRole, recipientId: string | null): Promise<void> {
  await prisma.notification.updateMany({
    where: { ...recipientWhere(role, recipientId), isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// Mevcut aktörü oturum cookie'lerinden çözer (öncelik: admin > agent > user).
export async function currentNotificationActor(): Promise<{ role: NotificationRole; id: string | null } | null> {
  const [admin, agent, user] = await Promise.all([getSession(), getAgentSession(), getUserSession()]);
  if (admin) return { role: "admin", id: null };
  if (agent) return { role: "agent", id: agent.agentId };
  if (user) return { role: "user", id: user.userId };
  return null;
}
