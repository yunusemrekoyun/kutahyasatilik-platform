import { afterEach, describe, expect, it, vi } from "vitest";

describe("AUTH_SECRET configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects a missing signing secret", async () => {
    vi.stubEnv("AUTH_SECRET", undefined);

    await expect(import("../lib/authSecret")).rejects.toThrow(
      "AUTH_SECRET must be configured with at least 32 characters",
    );
  });

  it("rejects a signing secret below the minimum length", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(31));

    await expect(import("../lib/authSecret")).rejects.toThrow(
      "AUTH_SECRET must be configured with at least 32 characters",
    );
  });

  it("accepts a signing secret at the inclusive minimum length", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));

    const { authSecret } = await import("../lib/authSecret");
    expect(authSecret.byteLength).toBe(32);
  });

  it("trims surrounding whitespace before creating the signing key", async () => {
    vi.stubEnv("AUTH_SECRET", `  ${"x".repeat(32)}  `);

    const { authSecret } = await import("../lib/authSecret");
    expect(new TextDecoder().decode(authSecret)).toBe("x".repeat(32));
  });
});
