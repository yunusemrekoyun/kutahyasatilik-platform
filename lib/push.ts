import "server-only";
import { randomUUID } from "crypto";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { prisma } from "./prisma";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });
const MAX_ATTEMPTS = 5;

type NotificationForPush = {
  id: string;
  recipientRole: string;
  recipientId: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
};

function publicPushBody(notification: NotificationForPush): string | undefined {
  // Yönetim ve danışman bildirimlerinde PII kilit ekranına taşınmaz.
  if (notification.recipientRole !== "user") return "Ayrıntıları görmek için uygulamayı açın.";
  return notification.type === "new_match" ? notification.body ?? undefined : undefined;
}

function retryAt(attempts: number) {
  const minutes = Math.min(60, 2 ** Math.max(0, attempts));
  return new Date(Date.now() + minutes * 60_000);
}

export async function dispatchPendingPushes(): Promise<{ sent: number; retried: number; failed: number }> {
  if (process.env.PUSH_ENABLED !== "true") return { sent: 0, retried: 0, failed: 0 };

  const now = new Date();
  // Yarım kalan worker kilitleri on dakika sonra yeniden kuyruğa alınır.
  await prisma.pushDelivery.updateMany({
    where: { status: "processing", nextAttemptAt: { lte: now } },
    data: { status: "pending", claimId: null },
  });
  const candidates = await prisma.pushDelivery.findMany({
    where: { status: "pending", nextAttemptAt: { lte: new Date() }, pushToken: { active: true } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true },
  });
  if (!candidates.length) return { sent: 0, retried: 0, failed: 0 };

  const claimId = randomUUID();
  await prisma.pushDelivery.updateMany({
    where: { id: { in: candidates.map((row) => row.id) }, status: "pending", nextAttemptAt: { lte: now } },
    data: { status: "processing", claimId, nextAttemptAt: new Date(now.getTime() + 10 * 60_000) },
  });
  const deliveries = await prisma.pushDelivery.findMany({
    where: { claimId },
    orderBy: { createdAt: "asc" },
    include: { pushToken: true, notification: true },
  });
  if (!deliveries.length) return { sent: 0, retried: 0, failed: 0 };

  const valid = deliveries.filter((d) => Expo.isExpoPushToken(d.pushToken.token));
  const invalid = deliveries.filter((d) => !Expo.isExpoPushToken(d.pushToken.token));
  if (invalid.length) {
    await Promise.all(invalid.map((d) => prisma.$transaction([
      prisma.pushToken.update({ where: { id: d.pushTokenId }, data: { active: false, lastError: "InvalidExpoPushToken" } }),
      prisma.pushDelivery.update({ where: { id: d.id }, data: { status: "failed", claimId: null, error: "InvalidExpoPushToken", attempts: { increment: 1 } } }),
    ])));
  }
  if (!valid.length) return { sent: 0, retried: 0, failed: invalid.length };

  const messages: ExpoPushMessage[] = valid.map((d) => ({
    to: d.pushToken.token,
    title: d.notification.title,
    body: publicPushBody(d.notification),
    sound: "default",
    channelId: "default",
    data: { notificationId: d.notificationId, link: d.notification.link },
  }));

  let tickets: ExpoPushTicket[];
  try {
    tickets = await expo.sendPushNotificationsAsync(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Expo push request failed";
    await Promise.all(valid.map((d) => {
      const attempts = d.attempts + 1;
      return prisma.pushDelivery.update({
        where: { id: d.id },
        data: attempts >= MAX_ATTEMPTS
          ? { status: "failed", claimId: null, attempts, error: message }
          : { status: "pending", claimId: null, attempts, error: message, nextAttemptAt: retryAt(attempts) },
      });
    }));
    return { sent: 0, retried: valid.filter((d) => d.attempts + 1 < MAX_ATTEMPTS).length, failed: invalid.length + valid.filter((d) => d.attempts + 1 >= MAX_ATTEMPTS).length };
  }

  let sent = 0;
  let retried = 0;
  let failed = invalid.length;
  for (let i = 0; i < valid.length; i++) {
    const delivery = valid[i];
    const ticket = tickets[i];
    const attempts = delivery.attempts + 1;
    if (ticket?.status === "ok") {
      sent++;
      await prisma.pushDelivery.update({
        where: { id: delivery.id },
        data: { status: "sent", claimId: null, ticketId: ticket.id, sentAt: new Date(), attempts, error: null },
      });
      continue;
    }
    const code = ticket?.details?.error;
    const error = ticket?.message || String(code || "Push rejected");
    if (code === "DeviceNotRegistered") {
      failed++;
      await prisma.$transaction([
        prisma.pushToken.update({ where: { id: delivery.pushTokenId }, data: { active: false, lastError: error } }),
        prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "failed", claimId: null, attempts, error } }),
      ]);
    } else if (attempts >= MAX_ATTEMPTS) {
      failed++;
      await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "failed", claimId: null, attempts, error } });
    } else {
      retried++;
      await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "pending", claimId: null, attempts, error, nextAttemptAt: retryAt(attempts) } });
    }
  }
  return { sent, retried, failed };
}

export async function checkPushReceipts(): Promise<{ delivered: number; failed: number }> {
  if (process.env.PUSH_ENABLED !== "true") return { delivered: 0, failed: 0 };
  const rows = await prisma.pushDelivery.findMany({
    where: {
      status: "sent",
      ticketId: { not: null },
      receiptCheckedAt: null,
      sentAt: { lte: new Date(Date.now() - 15 * 60_000) },
    },
    take: 1000,
    include: { pushToken: true },
  });
  if (!rows.length) return { delivered: 0, failed: 0 };

  const ids = rows.map((r) => r.ticketId).filter((id): id is string => !!id);
  const receipts = await expo.getPushNotificationReceiptsAsync(ids);
  let delivered = 0;
  let failed = 0;
  for (const row of rows) {
    if (!row.ticketId) continue;
    const receipt = receipts[row.ticketId];
    if (!receipt) continue;
    if (receipt.status === "ok") {
      delivered++;
      await prisma.pushDelivery.update({ where: { id: row.id }, data: { status: "delivered", receiptCheckedAt: new Date(), error: null } });
      continue;
    }
    failed++;
    const code = receipt.details?.error;
    const error = receipt.message || String(code || "Push receipt failed");
    await prisma.$transaction([
      prisma.pushDelivery.update({ where: { id: row.id }, data: { status: "failed", receiptCheckedAt: new Date(), error } }),
      ...(code === "DeviceNotRegistered"
        ? [prisma.pushToken.update({ where: { id: row.pushTokenId }, data: { active: false, lastError: error } })]
        : []),
    ]);
  }
  return { delivered, failed };
}
