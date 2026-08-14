import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Expo receipt ucu istek başına EN ÇOK 300 bilet alır. lib/push.ts eskiden
// take:1000 ile topladığı biletleri tek çağrıda gönderiyordu; gerçek hacimde
// throw edip worker'ı 500'e düşürüyordu. Mock bu sınırı gerçekçi taklit ediyor
// ki chunk'lama testle kilitlensin.
const EXPO_RECEIPT_CHUNK = 300;

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
    // Gerçek SDK'daki gibi 300'lük parçalara böler.
    chunkPushNotificationReceiptIds(ids: string[]) {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 300) chunks.push(ids.slice(i, i + 300));
      return chunks;
    }
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

  it("splits receipt lookups into Expo sized chunks", async () => {
    // 301 bilet: tek çağrıda gönderilirse Expo reddediyor. Sorgu tavanı 1000
    // olduğu için bu senaryo gerçek hacimde kaçınılmazdı.
    const rows = Array.from({ length: EXPO_RECEIPT_CHUNK + 1 }, (_, i) => ({
      id: `delivery-${i}`,
      ticketId: `ticket-${i}`,
      attempts: 1,
      pushTokenId: `token-${i}`,
      pushToken: { id: `token-${i}` },
    }));
    mocks.findMany.mockResolvedValue(rows);
    mocks.getReceipts.mockImplementation((ids: string[]) =>
      Promise.resolve(Object.fromEntries(ids.map((id) => [id, { status: "ok" }]))),
    );

    await expect(checkPushReceipts()).resolves.toEqual({
      delivered: EXPO_RECEIPT_CHUNK + 1,
      retried: 0,
      failed: 0,
    });

    // İki çağrı: 300 + 1. Hiçbir çağrı sınırı aşmamalı.
    expect(mocks.getReceipts).toHaveBeenCalledTimes(2);
    for (const [ids] of mocks.getReceipts.mock.calls) {
      expect(ids.length).toBeLessThanOrEqual(EXPO_RECEIPT_CHUNK);
    }
  });
});
