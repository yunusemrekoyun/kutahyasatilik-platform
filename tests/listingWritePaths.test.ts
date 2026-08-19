import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * attrYear/attrKm türetilmiş kolonlarının HER ilan yazma yolunda doldurulmasını
 * kilitler.
 *
 * Neden statik tarama: bu kolonlar `attributes` JSONB'sinden türetiliyor ve
 * Prisma JSON alanına göre orderBy desteklemediği için kategoriye özel sıralama
 * ("Model Yılı", "Kilometre") tamamen bunlara bakıyor. Bir yazma yolu doldurmayı
 * atlarsa ORTAYA HATA ÇIKMIYOR — ilan sessizce NULL kalıyor ve `nulls: last`
 * yüzünden listenin en dibine düşüyor. Tip sistemi de yakalamıyor, çünkü kolonlar
 * nullable.
 *
 * Bu tam olarak yaşandı: kolonlar eklendiğinde dört yazma yolundan yalnız ikisi
 * (admin + v1) güncellendi; bireysel ilan verme ve emlakçı web paneli atlandı,
 * dolayısıyla siteden açılan her vasıta ilanı sıralamada kayıptı.
 *
 * Yeni bir yazma yolu eklerken: `sortableAttributeColumns(...)` çağır, ya da
 * emlak dalında olduğu gibi açıkça `attrYear: null, attrKm: null` yaz.
 */
const WRITE_PATHS = [
  "app/(site)/ilan-ver/actions.ts",
  "app/emlakci/panel/actions.ts",
  "app/admin/actions.ts",
  "lib/apiAgentListing.ts",
  "prisma/seed-categories.ts",
  "prisma/seed-demo-catalog.ts",
];

const root = join(__dirname, "..");

describe("ilan yazma yolları sıralama kolonlarını dolduruyor", () => {
  for (const path of WRITE_PATHS) {
    it(path, () => {
      const source = readFileSync(join(root, path), "utf8");

      // Bu dosya gerçekten ilan yazıyor mu? Yazmıyorsa liste bayatlamış demektir.
      expect(
        /listing\.(create|update|upsert|createMany)|listing\.upsert/i.test(source) ||
          source.includes("attributes"),
        `${path} artık ilan yazmıyor gibi görünüyor — bu listeden çıkarılmalı`,
      ).toBe(true);

      expect(
        source.includes("sortableAttributeColumns") || source.includes("attrYear"),
        `${path} attributes yazıyor ama attrYear/attrKm doldurmuyor: ` +
          "kategoriye özel sıralama bu yoldan açılan ilanlarda çalışmaz",
      ).toBe(true);
    });
  }
});
