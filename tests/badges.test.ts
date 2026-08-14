import { describe, expect, it } from "vitest";
import { computeBadges } from "../lib/badges";

// Fırsat rozeti ilçe EMLAK ortalamalarına dayanıyor. Kategori kapısı yokken bir
// vasıta/teknoloji ilanı da bu hesaba giriyordu; site genel ilan sitesine
// açıldığında bu, karşılığı olmayan bir fiyat iddiası anlamına gelir.
const base = {
  price: 2_000_000,
  createdAt: new Date("2020-01-01"),
  avgPriceDaire: 3_000_000,
  avgPriceArsaM2: 2_000,
};

describe("ilan rozetleri", () => {
  it("emlak dairesinde bölge ortalamasının altını fırsat sayar", () => {
    const badges = computeBadges({ ...base, category: "emlak", propertyType: "daire" });

    expect(badges.map((badge) => badge.tone)).toContain("deal");
  });

  it("kategori verilmeyen eski çağrı yerlerini emlak sayar", () => {
    const badges = computeBadges({ ...base, propertyType: "daire" });

    expect(badges.map((badge) => badge.tone)).toContain("deal");
  });

  it("emlak dışı ilanda fırsat rozeti üretmez", () => {
    const badges = computeBadges({ ...base, category: "teknoloji", propertyType: "telefon" });

    expect(badges.map((badge) => badge.tone)).not.toContain("deal");
  });

  it("alt türü 'arsa' olan emlak dışı bir ilanı arsa m² hesabına sokmaz", () => {
    // "arsa" yalnız emlakta bir alt tür; kategori kapısı olmadan LAND_TYPES
    // eşleşmesi kategoriye bakmadan devreye giriyordu.
    const badges = computeBadges({
      ...base,
      category: "vasita",
      propertyType: "arsa",
      areaGross: 5_000,
      price: 1_000_000,
    });

    expect(badges.map((badge) => badge.tone)).not.toContain("deal");
  });

  it("ilgi ve yenilik rozetleri kategoriden bağımsız çalışır", () => {
    const badges = computeBadges({
      price: 50_000,
      category: "teknoloji",
      propertyType: "telefon",
      createdAt: new Date(),
      recentViews: 40,
    });

    expect(badges.map((badge) => badge.tone)).toEqual(expect.arrayContaining(["hot", "new"]));
  });
});
