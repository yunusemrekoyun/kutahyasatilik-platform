import { describe, expect, it } from "vitest";
import { buildOrderBy, buildWhere, sortOptionsFor } from "../lib/listingFilters";
import { sortableAttributeColumns } from "../lib/categories";

describe("buildWhere directory ownership", () => {
  it("limits agency portfolios to approved, published owners and active listings", () => {
    expect(buildWhere({ agencySlug: "ornek-ofis" })).toMatchObject({
      status: "active",
      moderationStatus: "approved",
      agencyRef: {
        is: { slug: "ornek-ofis", status: "approved", published: true },
      },
    });
  });

  it("limits adviser portfolios to approved public profiles and active listings", () => {
    expect(buildWhere({ agentSlug: "ornek-danisman" })).toMatchObject({
      status: "active",
      moderationStatus: "approved",
      agent: {
        is: { slug: "ornek-danisman", status: "approved", publicProfile: true },
      },
    });
  });
});

// Kategoriye özel sıralama: vasıta arayanın ilk iki refleksi ("en yeni model",
// "en az kilometre") sitede hiç yoktu. yil/kilometre JSONB içinde olduğu ve
// Prisma JSON alanına göre orderBy desteklemediği için sıralanabilir kolonlara
// kopyalanıyor; bu testler hem seçenek listesini hem kolon türetimini kilitliyor.
describe("kategoriye özel sıralama", () => {
  it("ortak sıralamalar her kategoride var", () => {
    for (const category of ["emlak", "vasita", "teknoloji"]) {
      const values = sortOptionsFor(category).map((o) => o.value);
      expect(values).toEqual(expect.arrayContaining(["", "price_asc", "price_desc"]));
    }
  });

  it("kilometre yalnız vasıtada, alan yalnız emlakta sunulur", () => {
    const vasita = sortOptionsFor("vasita").map((o) => o.value);
    const emlak = sortOptionsFor("emlak").map((o) => o.value);
    expect(vasita).toEqual(expect.arrayContaining(["year_desc", "km_asc"]));
    expect(vasita).not.toContain("area_desc");
    expect(emlak).toEqual(expect.arrayContaining(["area_desc"]));
    expect(emlak).not.toContain("km_asc");
  });

  it("bilinmeyen kategoride yalnız ortak sıralamalar kalır", () => {
    expect(sortOptionsFor("yok").map((o) => o.value)).toEqual(["", "price_asc", "price_desc", "oldest"]);
  });

  it("boş değerler sona atılır — verisi olmayan ilan listenin başını kapatmasın", () => {
    expect(buildOrderBy("km_asc")).toEqual([{ attrKm: { sort: "asc", nulls: "last" } }]);
    expect(buildOrderBy("year_desc")).toEqual([{ attrYear: { sort: "desc", nulls: "last" } }]);
  });

  it("tanınmayan sıralama önerilene döner", () => {
    expect(buildOrderBy("uydurma")).toEqual([{ featured: "desc" }, { createdAt: "desc" }]);
  });

  it("sıralanabilir kolonlar attributes'tan türetilir", () => {
    expect(sortableAttributeColumns({ yil: 2015, kilometre: 120000 })).toEqual({ attrYear: 2015, attrKm: 120000 });
    // Form değerleri metin gelebiliyor.
    expect(sortableAttributeColumns({ yil: "2015", kilometre: "90000" })).toEqual({ attrYear: 2015, attrKm: 90000 });
    // Emlakta attributes yok; kolonlar boş kalmalı.
    expect(sortableAttributeColumns(null)).toEqual({ attrYear: null, attrKm: null });
    expect(sortableAttributeColumns({ marka: "Apple" })).toEqual({ attrYear: null, attrKm: null });
  });
});
