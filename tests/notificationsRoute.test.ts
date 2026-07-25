import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  checkRate: vi.fn(),
  listNotificationsPage: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  resolveApiSession: vi.fn(),
  unreadCount: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));
vi.mock("@/lib/apiAuth", () => ({
  resolveApiSession: mocks.resolveApiSession,
}));
vi.mock("@/lib/rateLimit", () => ({
  checkRate: mocks.checkRate,
}));
vi.mock("@/lib/notify", () => ({
  listNotificationsPage: mocks.listNotificationsPage,
  markAllRead: mocks.markAllRead,
  markRead: mocks.markRead,
  unreadCount: mocks.unreadCount,
}));

import { GET } from "../app/api/v1/notifications/route";
import { POST } from "../app/api/v1/notifications/read/route";

describe("notification API failure responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveApiSession.mockResolvedValue({ id: "user-1", role: "user" });
    mocks.checkRate.mockResolvedValue(null);
  });

  it("returns a 500 JSON response when notification listing fails", async () => {
    const databaseError = new Error("database unavailable");
    mocks.listNotificationsPage.mockRejectedValue(databaseError);
    mocks.unreadCount.mockResolvedValue(0);

    const response = await GET(
      new NextRequest("https://kutahyasatilik.com/api/v1/notifications"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Bildirimler yüklenemedi",
    });
    expect(mocks.captureException).toHaveBeenCalledWith(databaseError);
  });

  it("returns a 500 JSON response when marking a notification fails", async () => {
    const databaseError = new Error("write failed");
    mocks.markRead.mockRejectedValue(databaseError);

    const response = await POST(
      new NextRequest(
        "https://kutahyasatilik.com/api/v1/notifications/read",
        {
          method: "POST",
          body: JSON.stringify({ id: "notification-1" }),
          headers: { "content-type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Bildirim güncellenemedi",
    });
    expect(mocks.captureException).toHaveBeenCalledWith(databaseError);
  });
});
