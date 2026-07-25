import { describe, expect, it } from "vitest";
import {
  buildPublicPushContent,
  expiredPushReceiptCutoff,
  MAX_PUSH_ATTEMPTS,
  nextPushAttemptAt,
  nextPushReceiptCheckAt,
  pushFailureAction,
} from "../lib/pushPolicy";

describe("push failure policy", () => {
  it("deactivates an unregistered device token", () => {
    expect(pushFailureAction("DeviceNotRegistered", 1)).toBe("deactivate");
  });

  it("retries a transient rate-limit failure with bounded backoff", () => {
    expect(pushFailureAction("MessageRateExceeded", 1)).toBe("retry");
    expect(
      pushFailureAction("MessageRateExceeded", MAX_PUSH_ATTEMPTS),
    ).toBe("fail");
    expect(nextPushAttemptAt(3, 0).getTime()).toBe(8 * 60_000);
  });

  it("does not retry permanent ticket or receipt failures", () => {
    expect(pushFailureAction("InvalidCredentials", 1)).toBe("fail");
    expect(pushFailureAction("MessageTooBig", 1)).toBe("fail");
    expect(pushFailureAction("MismatchSenderId", 1)).toBe("fail");
    expect(pushFailureAction(undefined, 1)).toBe("fail");
  });

  it("expires receipts after Expo's 24-hour retention window", () => {
    expect(expiredPushReceiptCutoff(25 * 60 * 60_000).getTime()).toBe(
      60 * 60_000,
    );
  });

  it("moves a missing receipt out of the immediately due window", () => {
    const now = 1_000_000;
    expect(nextPushReceiptCheckAt(now).getTime()).toBeGreaterThan(now);
  });

  it("never exposes private message text in a lock-screen title or body", () => {
    expect(
      buildPublicPushContent({
        recipientRole: "agent",
        type: "message",
        body: "private message",
      }),
    ).toEqual({ title: "Yeni mesaj" });
    expect(
      buildPublicPushContent({
        recipientRole: "admin",
        type: "new_lead",
        body: "phone and email",
      }),
    ).toEqual({ title: "Yeni talep" });
  });

  it("keeps only the listing title for a user's new-match preview", () => {
    expect(
      buildPublicPushContent({
        recipientRole: "user",
        type: "new_match",
        body: "Merkezde 3+1 daire",
      }),
    ).toEqual({
      title: "Aramanıza uygun yeni ilan",
      body: "Merkezde 3+1 daire",
    });
  });
});
