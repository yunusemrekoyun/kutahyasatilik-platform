export const MAX_PUSH_ATTEMPTS = 5;

/**
 * Kuyrukta bu yaştan eski teslimat GÖNDERİLMEZ, doğrudan `failed` olur.
 *
 * PUSH_ENABLED uzun süre kapalı kaldı ve outbox birikmeye devam etti. Bayrak
 * açıldığı anda filtre olmasaydı aylar öncesine ait "yeni mesajınız var"
 * bildirimleri 100'erli turlarla kullanıcılara giderdi. TTL'i olmayan bir
 * kuyruğun tek koruması bu.
 *
 * PUSH_MAX_QUEUE_AGE_HOURS ile ezilebilir; 0 verilirse filtre kapanır.
 */
export const PUSH_MAX_QUEUE_AGE_MS = (() => {
  const raw = Number(process.env.PUSH_MAX_QUEUE_AGE_HOURS);
  const hours = Number.isFinite(raw) && raw >= 0 ? raw : 72;
  return hours * 3600_000;
})();

/** Bu tarihten eski teslimatlar bayatlamış sayılır (0 = filtre kapalı → null). */
export function staleQueueCutoff(now = Date.now()): Date | null {
  return PUSH_MAX_QUEUE_AGE_MS > 0 ? new Date(now - PUSH_MAX_QUEUE_AGE_MS) : null;
}
export const PUSH_RECEIPT_RETENTION_MS = 24 * 60 * 60_000;
export const PUSH_RECEIPT_RECHECK_MS = 15 * 60_000;

const TRANSIENT_RECEIPT_ERRORS = new Set([
  "MessageRateExceeded",
]);

export type PushFailureAction = "deactivate" | "retry" | "fail";

export function pushFailureAction(
  code: string | undefined,
  attempts: number,
): PushFailureAction {
  if (code === "DeviceNotRegistered") return "deactivate";
  if (TRANSIENT_RECEIPT_ERRORS.has(code || "") && attempts < MAX_PUSH_ATTEMPTS) {
    return "retry";
  }
  return "fail";
}

export function nextPushAttemptAt(attempts: number, now = Date.now()): Date {
  const minutes = Math.min(60, 2 ** Math.max(0, attempts));
  return new Date(now + minutes * 60_000);
}

export function expiredPushReceiptCutoff(now = Date.now()): Date {
  return new Date(now - PUSH_RECEIPT_RETENTION_MS);
}

export function nextPushReceiptCheckAt(now = Date.now()): Date {
  return new Date(now + PUSH_RECEIPT_RECHECK_MS);
}

type PublicPushInput = {
  recipientRole: string;
  type: string;
  body: string | null;
};

export function buildPublicPushContent(
  notification: PublicPushInput,
): { title: string; body?: string } {
  if (notification.type === "new_match" && notification.recipientRole === "user") {
    return {
      title: "Aramanıza uygun yeni ilan",
      body: notification.body ?? undefined,
    };
  }

  // Başlıklar bilerek GENEL: kilit ekranında kişisel veri görünmesin, detay
  // yalnız uygulama içinde auth sonrası açılsın. Haritada olmayan tür
  // "Yeni bildirim"e düşüyordu — kullanıcı neye tıkladığını anlamıyordu.
  const titleByType: Record<string, string> = {
    ad_request: "Yeni reklam talebi",
    agent_application: "Yeni danışman başvurusu",
    listing_approved: "İlan güncellemesi",
    listing_pending: "Onay bekleyen ilan",
    listing_rejected: "İlan güncellemesi",
    message: "Yeni mesaj",
    new_alert: "Yeni alıcı talebi",
    new_lead: "Yeni talep",
    new_match: "Aramanıza uygun yeni ilan",
    offer: "Teklif güncellemesi",
    payment: "Ödeme güncellemesi",
    system: "Hesap güncellemesi",
  };

  return { title: titleByType[notification.type] ?? "Yeni bildirim" };
}
