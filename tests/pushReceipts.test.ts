import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReceipts: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("expo-server-sdk", () => ({
  Expo: class {
    getPushNotificationReceiptsAsync = mocks.getReceipts;
  },
}));
vi.mock("../lib/prisma", () => ({
  prisma: {
    pushDelivery: {
      findMany: mocks.findMany,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
    pushToken: {
      update: vi.fn(),
    },
    $transaction: mocks.transaction,
  },
}));

import { checkPushReceipts } from "../lib/push";

describe("push receipt worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T12:00:00.000Z"));
    process.env.PUSH_ENABLED = "true";
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.update.mockResolvedValue({});
    mocks.transaction.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.PUSH_ENABLED;
    vi.useRealTimers();
  });

  it("reschedules a missing receipt while still processing later receipts", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "delivery-missing",
        ticketId: "ticket-missing",
        attempts: 1,
        pushTokenId: "token-1",
        pushToken: { id: "token-1" },
      },
      {
        id: "delivery-delivered",
        ticketId: "ticket-delivered",
        attempts: 1,
        pushTokenId: "token-2",
        pushToken: { id: "token-2" },
      },
    ]);
    mocks.getReceipts.mockResolvedValue({
      "ticket-delivered": { status: "ok" },
    });

    await expect(checkPushReceipts()).resolves.toEqual({
      delivered: 1,
      retried: 0,
      failed: 0,
    });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nextAttemptAt: { lte: new Date("2026-07-25T12:00:00.000Z") },
        }),
        orderBy: [
          { nextAttemptAt: "asc" },
          { sentAt: "asc" },
          { id: "asc" },
        ],
      }),
    );
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "delivery-missing" },
      data: {
        nextAttemptAt: new Date("2026-07-25T12:15:00.000Z"),
      },
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "delivery-delivered" },
        data: expect.objectContaining({ status: "delivered" }),
      }),
    );
  });
});
