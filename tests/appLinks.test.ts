import { describe, expect, it } from "vitest";
import {
  buildAndroidAssetLinks,
  buildAppleAppSiteAssociation,
} from "../lib/appLinks";

const validFingerprint = Array.from(
  { length: 32 },
  (_, index) => ((index * 7 + 19) % 256).toString(16).padStart(2, "0"),
).join(":");

describe("app-link configuration", () => {
  it("does not publish incomplete or malformed Apple configuration", () => {
    expect(buildAppleAppSiteAssociation(undefined, undefined)).toBeNull();
    expect(buildAppleAppSiteAssociation("invalid", "com.example.app")).toBeNull();
  });

  it("builds Apple configuration only from a valid team and bundle identifier", () => {
    const body = buildAppleAppSiteAssociation("A1B2C3D4E5", "com.example.app");
    expect(body?.applinks.details[0].appID).toBe("A1B2C3D4E5.com.example.app");
    expect(body?.applinks.details[0].components).toContainEqual({ "/": "/ilan/*" });
  });

  it("does not publish incomplete or malformed Android configuration", () => {
    expect(buildAndroidAssetLinks(undefined, undefined)).toBeNull();
    expect(buildAndroidAssetLinks("not-a-fingerprint", "com.example.app")).toBeNull();
  });

  it("normalizes valid Android fingerprints and removes duplicates", () => {
    const body = buildAndroidAssetLinks(
      `${validFingerprint},${validFingerprint.toUpperCase()}`,
      "com.example.app",
    );
    expect(body?.[0].target.sha256_cert_fingerprints).toEqual([
      validFingerprint.toUpperCase(),
    ]);
  });
});
