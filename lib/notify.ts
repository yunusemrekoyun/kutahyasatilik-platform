import "server-only";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { getAgentSession } from "./agentAuth";
import { getUserSession } from "./userAuth";
import { sendEmail, notificationEmail, emailEnabled } from "./email";
import { findAlertsForListing, type ListingForMatch } from "./matching";

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
    // Bildirim ve cihaz outbox satırları tek transaction'da oluşur; worker daha sonra gönderir.
    await prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          recipientRole: opts.recipientRole,
          recipientId: opts.recipientId ?? null,
          type: opts.type,
          title: opts.title,
          body: opts.body ?? null,
          link: opts.link ?? null,
        },
      });
      const tokens = await tx.pushToken.findMany({
        where: {
          recipientRole: opts.recipientRole,
          ...(opts.recipientId ? { recipientId: opts.recipientId } : {}),
          active: true,
        },
        select: { id: true },
      });
      if (tokens.length) {
        await tx.pushDelivery.createMany({
          data: tokens.map((token) => ({ notificationId: notification.id, pushTokenId: token.id })),
          skipDuplicates: true,
        });
      }
    });
  } catch {
    // Bildirim ikincil — tablo henüz yoksa ya da hata olursa sessizce geç.
  }
  // E-posta kanalı (ikincil, fire-and-forget; isteği bloke etmez, anahtar yoksa atlanır).
  void dispatchEmail(opts);
}

// Bildirimi alıcının e-postasına da gönderir: admin -> ADMIN_EMAIL, agent/user -> kendi e-postası.
async function dispatchEmail(opts: CreateOpts): Promise<void> {
  if (!emailEnabled()) return;
  try {
    let to: string | null = null;
    if (opts.recipientRole === "admin") {
      to = process.env.ADMIN_EMAIL || null;
    } else if (opts.recipientRole === "agent" && opts.recipientId) {
      const a = await prisma.agent.findUnique({ where: { id: opts.recipientId }, select: { email: true } });
      to = a?.email ?? null;
    } else if (opts.recipientRole === "user" && opts.recipientId) {
      const u = await prisma.user.findUnique({ where: { id: opts.recipientId }, select: { email: true } });
      to = u?.email ?? null;
    }
    if (!to) return;
    await sendEmail({ to, subject: opts.title, html: notificationEmail(opts) });
  } catch {
    // En iyi çaba.
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

// Yeni yayınlanan/onaylanan ilanı eşleşen AKTİF kayıtlı aramalara bildirir.
// userId varsa in-app (+ e-posta hesap adresine); anonim alert ise yalnız e-posta.
export async function notifyMatchingAlerts(
  listing: ListingForMatch & { title: string; slug: string }
): Promise<void> {
  try {
    const alerts = await findAlertsForListing(listing, 100);
    const link = `/ilan/${listing.slug}`;
    const title = "Aramanıza uygun yeni ilan";
    const body = listing.title;
    let n = 0;
    for (const a of alerts) {
      if (n >= 50) break; // güvenlik sınırı (tek ilan çok alert'i tetiklemesin)
      n++;
      if (a.userId) {
        await notifyUser(a.userId, { type: "new_match", title, body, link });
      } else if (a.email) {
        await sendEmail({ to: a.email, subject: title, html: notificationEmail({ title, body, link }) });
      }
    }
  } catch {
    // ikincil — eşleştirme/bildirim ana akışı bozmaz
  }
}

// --- Listeleme / okuma (alıcı = mevcut aktör) ---

function recipientWhere(role: NotificationRole, recipientId: string | null) {
  // admin kutusu ortak (recipientId null); agent/user kendi id'si.
  if (role === "admin") return { recipientRole: "admin" };
  // Defansif: alıcı id'si yoksa hiçbir kayıt eşleşmesin (undefined WHERE'den düşmesin).
  if (!recipientId) return { id: "__none__" };
  return { recipientRole: role, recipientId };
}

export async function listNotifications(role: NotificationRole, recipientId: string | null, limit = 20) {
  return prisma.notification.findMany({
    where: recipientWhere(role, recipientId),
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listNotificationsPage(
  role: NotificationRole,
  recipientId: string | null,
  limit = 20,
  cursor?: string
) {
  const take = Math.min(50, Math.max(1, limit));
  const rows = await prisma.notification.findMany({
    where: recipientWhere(role, recipientId),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
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
