import { describe, expect, it, vi } from "vitest";

// Prisma taklit ediliyor: burada test edilen şey SORGU ŞEKLİ ve nitelik
// karşılaştırması, veritabanı değil.
vi.mock("../lib/prisma", () => ({ prisma: {} }));

const { alertToListingWhere, attributesSatisfy, listingToAlertWhere } = await import("../lib/matching");

// Kayıtlı arama artık her kategoride. Önceden kapsam kod tarafında "emlak"
// olarak sabitti ve vasıta/teknoloji arayan kullanıcıya ASLA eşleşme gitmiyordu —
// arayüz "uygun ilan gelince haber verelim" derken karşılığı yoktu.

describe("talepten ilana sorgu", () => {
  it("kategori yoksa emlağa düşer", () => {
    expect(alertToListingWhere({})).toMatchObject({ category: "emlak" });
  });

  it("emlakta oda ve alan gerçek kolonlardan sorgulanır", () => {
    const where = alertToListingWhere({ category: "emlak", rooms: "3+1", minArea: 100 });
    expect(where).toMatchObject({ rooms: "3+1", areaGross: { gte: 100 } });
  });

  it("emlak dışında oda ve alan sorguya GİRMEZ", () => {
    // Girerse sorgu hiçbir zaman sonuç dönmez: vasıta ilanlarında bu kolonlar boş.
    const where = alertToListingWhere({ category: "vasita", rooms: "3+1", minArea: 100 });
    expect(where.rooms).toBeUndefined();
    expect(where.areaGross).toBeUndefined();
  });

  it("kategoriye özel nitelikler JSONB koşuluna çevrilir", () => {
    const where = alertToListingWhere({
      category: "vasita",
      attributes: { yil_min: "2015", kilometre_max: "100000", yakit: "dizel" },
    });
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { attributes: { path: ["yil"], gte: 2015 } },
        { attributes: { path: ["kilometre"], lte: 100000 } },
        { attributes: { path: ["yakit"], equals: "dizel" } },
      ]),
    );
  });

  it("kayıtta olmayan nitelik sorguya sızmaz", () => {
    const where = alertToListingWhere({ category: "vasita", attributes: { uydurma: "x" } });
    expect(where.AND).toBeUndefined();
  });
});

describe("ilandan talebe sorgu", () => {
  const car = { category: "vasita", propertyType: "otomobil", district: "Merkez", price: 500_000 };

  it("aynı kategorideki talepleri arar", () => {
    expect(listingToAlertWhere(car)).toMatchObject({ status: "active", category: "vasita" });
  });

  it("emlak dışında oda/alan koşulu eklenmez", () => {
    const and = JSON.stringify(listingToAlertWhere(car).AND);
    expect(and).not.toContain("rooms");
    expect(and).not.toContain("minArea");
  });

  it("emlakta oda ve alan koşulu eklenir", () => {
    const and = JSON.stringify(listingToAlertWhere({ ...car, category: "emlak", propertyType: "daire" }).AND);
    expect(and).toContain("rooms");
    expect(and).toContain("minArea");
  });
});

describe("nitelik karşılaştırması", () => {
  const car = {
    category: "vasita",
    propertyType: "otomobil",
    district: "Merkez",
    price: 500_000,
    attributes: { yil: 2018, kilometre: 80_000, yakit: "dizel" },
  };

  it("kriter yoksa eşleşir", () => {
    expect(attributesSatisfy(car, {})).toBe(true);
  });

  it("aralık içindeki ilan eşleşir", () => {
    expect(attributesSatisfy(car, { attributes: { yil_min: "2015", kilometre_max: "100000" } })).toBe(true);
  });

  it("aralık dışındaki ilan elenir", () => {
    expect(attributesSatisfy(car, { attributes: { kilometre_max: "50000" } })).toBe(false);
    expect(attributesSatisfy(car, { attributes: { yil_min: "2020" } })).toBe(false);
  });

  it("seçim kriteri tutmuyorsa elenir", () => {
    expect(attributesSatisfy(car, { attributes: { yakit: "benzin" } })).toBe(false);
  });

  it("ilanda o alan yoksa eşleşme sayılmaz", () => {
    // "En fazla 100.000 km" diyen kullanıcıya kilometresi bilinmeyen araç önerilmemeli.
    const unknown = { ...car, attributes: { yil: 2018 } };
    expect(attributesSatisfy(unknown, { attributes: { kilometre_max: "100000" } })).toBe(false);
  });

  it("emlakta nitelik kontrolü yapılmaz — kriterler gerçek kolonlarda", () => {
    const flat = { category: "emlak", propertyType: "daire", district: "Merkez", price: 1, attributes: null };
    expect(attributesSatisfy(flat, { attributes: { kilometre_max: "1" } })).toBe(true);
  });
});
