export const MAX_PUSH_ATTEMPTS = 5;
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

  const titleByType: Record<string, string> = {
    ad_request: "Yeni reklam talebi",
    listing_approved: "İlan güncellemesi",
    message: "Yeni mesaj",
    new_lead: "Yeni talep",
    offer: "Teklif güncellemesi",
    system: "Hesap güncellemesi",
  };

  return { title: titleByType[notification.type] ?? "Yeni bildirim" };
}
