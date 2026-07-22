import { describe, expect, it } from "vitest";
import { listingImportKey, parseListingImportRow } from "../lib/listingImport";

const allowImages = (value: string) => value.split("|").map((item) => item.trim()).filter(Boolean);

describe("parseListingImportRow", () => {
  it("treats blank optional cells as omitted while preserving explicit false values", () => {
    const { input, errors } = parseListingImportRow({
      externalId: "PORT-42",
      title: "Güncel başlık",
      status: "",
      neighborhood: "",
      furnished: "0",
      parking: "evet",
      exchangeEligible: "hayır",
      parcelVisibility: "0",
      images: "",
      amenities: "",
    }, allowImages);

    expect(errors).toEqual([]);
    expect(input).toEqual({
      externalId: "PORT-42",
      title: "Güncel başlık",
      furnished: false,
      parking: true,
      exchangeEligible: false,
      parcelVisibility: false,
    });
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("images");
    expect(input).not.toHaveProperty("amenities");
  });

  it("keeps explicitly supplied status, images, and amenities", () => {
    const { input, errors } = parseListingImportRow({
      externalId: "PORT-43",
      status: "SOLD",
      amenities: "elevator|security",
      images: "/uploads/one.webp|/uploads/two.webp",
    }, allowImages);

    expect(errors).toEqual([]);
    expect(input.status).toBe("sold");
    expect(input.amenities).toEqual(["elevator", "security"]);
    expect(input.images).toEqual(["/uploads/one.webp", "/uploads/two.webp"]);
  });

  it("rejects values that would fail or mutate unexpectedly during commit", () => {
    const { input, errors } = parseListingImportRow({
      externalId: "PORT-44",
      price: "12.5",
      bathroomCount: "iki",
      dues: "99999999999",
      validUntil: "2026-02-31",
      exchangeEligible: "belki",
      creditEligible: "sometimes",
    }, allowImages);

    expect(input).toEqual({ externalId: "PORT-44" });
    expect(errors).toEqual(expect.arrayContaining([
      "price tam sayı olmalıdır",
      "bathroomCount tam sayı olmalıdır",
      "dues 32 bit tam sayı aralığında olmalıdır",
      "validUntil geçerli bir tarih olmalıdır",
      "exchangeEligible için true/false, evet/hayır veya 1/0 kullanın",
      "creditEligible geçersiz",
    ]));
  });

  it("rejects an image list when sanitization drops any requested URL", () => {
    const { input, errors } = parseListingImportRow({
      externalId: "PORT-45",
      images: "/uploads/ok.webp|http://unsafe.example/image.jpg",
    }, (value) => allowImages(value).filter((item) => item.startsWith("/uploads/")));

    expect(input).toEqual({ externalId: "PORT-45" });
    expect(errors).toContain("images yalnız /uploads yolu veya izin verilen HTTPS medya adresi içerebilir");
  });
});

describe("listingImportKey", () => {
  it("scopes agency and independent-adviser imports independently", () => {
    expect(listingImportKey("agent-a", "agency-a", " REF-1 ")).toBe("agency:agency-a:REF-1");
    expect(listingImportKey("agent-a", null, "REF-1")).toBe("agent:agent-a:REF-1");
    expect(listingImportKey("agent-b", null, "REF-1")).toBe("agent:agent-b:REF-1");
    expect(listingImportKey("agent-a", null, "  ")).toBeNull();
  });
});
