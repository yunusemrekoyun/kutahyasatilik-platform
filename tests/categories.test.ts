import { describe, expect, it } from "vitest";
import {
  CATEGORY_KEYS,
  CATEGORY_LIST,
  describeAttributes,
  formatAttributeValue,
  getCategory,
  getFilterableFields,
  getSubTypeLabel,
  isCategoryKey,
  parseAttributes,
  summarizeAttributes,
  toCategoryKey,
} from "../lib/categories";

// Kategori kaydı sitenin emlak sitesinden genel ilan sitesine dönüşümünün
// çekirdeği: hem yazma (form doğrulama) hem okuma (kart özeti, künye satırları)
// buradan besleniyor. Kırılırsa hata sessiz olur — ilan yanlış etiketle yayınlanır.

describe("kategori çözümleme", () => {
  it("bilinmeyen değeri emlağa düşürür", () => {
    // Eski kayıtların category kolonu boş olabiliyor; DB varsayılanı da emlak.
    expect(toCategoryKey(undefined)).toBe("emlak");
    expect(toCategoryKey("olmayan")).toBe("emlak");
    expect(getCategory(null).key).toBe("emlak");
  });

  it("geçerli anahtarları tanır", () => {
    for (const key of CATEGORY_KEYS) expect(isCategoryKey(key)).toBe(true);
    expect(isCategoryKey("emlakk")).toBe(false);
    expect(isCategoryKey(42)).toBe(false);
  });

  it("her kategoride alt tür ve etiket bulunur", () => {
    for (const category of CATEGORY_LIST) {
      expect(category.subTypes.length).toBeGreaterThan(0);
      for (const sub of category.subTypes) {
        expect(getSubTypeLabel(category.key, sub.value)).toBe(sub.label);
      }
    }
  });

  it("tanınmayan alt türü ham değer olarak döndürür", () => {
    // Kart bileşeni bu dönüşe güveniyor; boş string basarsa etiket kaybolur.
    expect(getSubTypeLabel("vasita", "hovercraft")).toBe("hovercraft");
  });

  it("emlakta nitelik alanı yoktur — veriler gerçek kolonlarda", () => {
    expect(getCategory("emlak").fields).toHaveLength(0);
    expect(getFilterableFields("emlak")).toHaveLength(0);
    expect(getFilterableFields("vasita").length).toBeGreaterThan(0);
  });
});

describe("parseAttributes", () => {
  it("zorunlu alan boşsa hata verir, değeri yazmaz", () => {
    const { values, errors } = parseAttributes("vasita", {});
    expect(errors.marka).toContain("zorunlu");
    expect(values.marka).toBeUndefined();
  });

  it("sayı alanında Türkçe binlik ve ondalık ayracını çözer", () => {
    // Form "120.000" ya da "120000" gönderebilir; ikisi de aynı sayı olmalı.
    const { values, errors } = parseAttributes("vasita", {
      marka: "Renault",
      model: "Clio",
      yil: "2015",
      kilometre: "120.000",
      yakit: "dizel",
      vites: "manuel",
      hasar: "hasarsiz",
    });
    expect(errors).toEqual({});
    expect(values.kilometre).toBe(120_000);
    expect(values.yil).toBe(2015);
  });

  it("aralık dışındaki sayıyı reddeder", () => {
    const { values, errors } = parseAttributes("vasita", { yil: "1200" });
    expect(errors.yil).toContain("en az");
    expect(values.yil).toBeUndefined();
  });

  it("seçim alanında kayıtta olmayan değeri reddeder", () => {
    // Doğrudan POST atan bir istemci uydurma değer gönderebilir.
    const { values, errors } = parseAttributes("vasita", { yakit: "nükleer" });
    expect(errors.yakit).toContain("geçersiz");
    expect(values.yakit).toBeUndefined();
  });

  it("kayıtta olmayan alanları yok sayar", () => {
    // Bilinmeyen alan eklemek geriye uyumlu olmalı, hata üretmemeli.
    const { values } = parseAttributes("teknoloji", { marka: "Apple", uydurma: "x" });
    expect(values.marka).toBe("Apple");
    expect(values.uydurma).toBeUndefined();
  });

  it("attr_ önekli form alanlarını da okur", () => {
    const { values } = parseAttributes("teknoloji", { attr_marka: "Samsung" });
    expect(values.marka).toBe("Samsung");
  });

  it("FormData girdisini de kabul eder", () => {
    const fd = new FormData();
    fd.set("attr_marka", "Xiaomi");
    fd.set("attr_model", "Redmi Note 13");
    expect(parseAttributes("teknoloji", fd).values.marka).toBe("Xiaomi");
  });

  it("metin alanını maxLength ile kırpar", () => {
    const { values } = parseAttributes("vasita", { marka: "x".repeat(200) });
    expect(String(values.marka).length).toBeLessThanOrEqual(40);
  });
});

describe("gösterim", () => {
  const yil = getCategory("vasita").fields.find((f) => f.key === "yil")!;
  const km = getCategory("vasita").fields.find((f) => f.key === "kilometre")!;
  const yakit = getCategory("vasita").fields.find((f) => f.key === "yakit")!;

  it("yıl binlik ayraç ALMAZ", () => {
    // "2.015 model" saçma; bu yüzden alanda plain işareti var.
    expect(formatAttributeValue(yil, 2015)).toBe("2015");
  });

  it("kilometre binlik ayraç ve birim alır", () => {
    expect(formatAttributeValue(km, 120000)).toBe("120.000 km");
  });

  it("seçim alanı ham değeri değil etiketi gösterir", () => {
    expect(formatAttributeValue(yakit, "dizel")).toBe("Dizel");
  });

  it("boş değer boş string döner", () => {
    expect(formatAttributeValue(km, null)).toBe("");
    expect(formatAttributeValue(km, "")).toBe("");
  });

  it("describeAttributes künye satırlarını sırayla üretir", () => {
    const rows = describeAttributes("vasita", { marka: "Fiat", model: "Egea", yil: 2019 });
    expect(rows.map((r) => r.key)).toEqual(["marka", "model", "yil"]);
    expect(rows[2].value).toBe("2019");
  });

  it("summarizeAttributes kart için kısa özet verir", () => {
    const summary = summarizeAttributes("vasita", { yil: 2019, kilometre: 85000 });
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.join(" ")).toContain("85.000");
  });

  it("emlakta nitelik özeti boştur — kart kendi kolonlarını kullanır", () => {
    expect(summarizeAttributes("emlak", { rooms: "3+1" })).toEqual([]);
    expect(describeAttributes("emlak", {})).toEqual([]);
  });

  it("bozuk attributes girdisinde çökmez", () => {
    // JSONB kolonu elle düzenlenmiş ya da eski biçimde olabilir.
    expect(describeAttributes("vasita", null)).toEqual([]);
    expect(describeAttributes("vasita", "metin")).toEqual([]);
    expect(summarizeAttributes("vasita", 42)).toEqual([]);
  });
});
