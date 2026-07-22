import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateExternalHttpUrl } from "../lib/externalUrl";
import { publicImageUrl, toTourEmbed } from "../lib/media";

describe("validateExternalHttpUrl", () => {
  it("accepts public HTTP and HTTPS institution links", () => {
    expect(validateExternalHttpUrl("https://www.turkiye.gov.tr/tapu-bilgileri-sorgulama"))
      .toMatchObject({ host: "turkiye.gov.tr", secure: true });
    expect(validateExternalHttpUrl("http://belediye.example.org/imar"))
      .toMatchObject({ host: "belediye.example.org", secure: false });
    expect(validateExternalHttpUrl("https://fcbelediye.example.org/imar"))
      .toMatchObject({ host: "fcbelediye.example.org", secure: true });
  });

  it("rejects unsafe protocols, credentials and private network links", () => {
    const credentialUrl = new URL("https://example.org/");
    credentialUrl.username = randomUUID();
    credentialUrl.password = randomUUID();
    expect(validateExternalHttpUrl("javascript:alert(1)")).toBeNull();
    expect(validateExternalHttpUrl(credentialUrl.toString())).toBeNull();
    expect(validateExternalHttpUrl("http://localhost:3000/admin")).toBeNull();
    expect(validateExternalHttpUrl("http://belediye/imar")).toBeNull();
    expect(validateExternalHttpUrl("http://192.168.1.10/imar")).toBeNull();
    expect(validateExternalHttpUrl("http://[::1]/internal")).toBeNull();
  });
});

describe("publicImageUrl", () => {
  it("allows same-origin and encrypted images only", () => {
    expect(publicImageUrl("/uploads/office.webp")).toBe("/uploads/office.webp");
    expect(publicImageUrl("https://cdn.example.org/office.webp")).toBe(
      "https://cdn.example.org/office.webp"
    );
    expect(publicImageUrl("http://localhost:3007/office.webp")).toBeNull();
    expect(publicImageUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("toTourEmbed", () => {
  it("embeds only credential-free HTTPS tour links", () => {
    expect(toTourEmbed("https://my.matterport.com/show/?m=abc123")).toContain(
      "https://my.matterport.com/show/?m=abc123"
    );
    expect(toTourEmbed("http://tour.example.org/view")).toBeNull();

    const credentialUrl = new URL("https://tour.example.org/view");
    credentialUrl.username = randomUUID();
    credentialUrl.password = randomUUID();
    expect(toTourEmbed(credentialUrl.toString())).toBeNull();
  });
});
