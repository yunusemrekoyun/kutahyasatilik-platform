import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Yük testi için toplu sahte ilan üretir.
//   COUNT=2000 tsx prisma/seed-bulk.ts   -> 2000 ilan ekler
//   CLEAN=1   tsx prisma/seed-bulk.ts    -> ürettiği test ilanlarını siler
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const COUNT = Number(process.env.COUNT || 1000);
const CLEAN = process.env.CLEAN === "1";
const PREFIX = "yuk-test-";

const DISTRICTS = [
  "Merkez", "Tavşanlı", "Simav", "Gediz", "Emet", "Domaniç", "Hisarcık",
  "Altıntaş", "Aslanapa", "Dumlupınar", "Çavdarhisar", "Pazarlar", "Şaphane",
];
const TYPES = ["daire", "villa", "mustakil", "arsa", "tarla", "isyeri"];
const ROOMS = ["1+1", "2+1", "3+1", "4+1", "5+1"];
const HEATING = ["Doğalgaz (Kombi)", "Merkezi", "Soba", "Yerden Isıtma"];

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  if (CLEAN) {
    const r = await prisma.listing.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    console.log(`🧹 ${r.count} test ilanı silindi.`);
    return;
  }

  console.log(`🌱 ${COUNT} test ilanı üretiliyor...`);
  const stamp = Date.now().toString(36);
  const batchSize = 250;
  let done = 0;

  for (let start = 0; start < COUNT; start += batchSize) {
    const n = Math.min(batchSize, COUNT - start);
    const rows = Array.from({ length: n }, (_, i) => {
      const idx = start + i;
      const type = pick(TYPES);
      const isLand = type === "arsa" || type === "tarla";
      const district = pick(DISTRICTS);
      const area = ri(55, 1500);
      return {
        slug: `${PREFIX}${stamp}-${idx}`,
        title: `${district} ${isLand ? "Satılık Arsa" : `${pick(ROOMS)} ${type === "villa" ? "Villa" : "Daire"}`} #${idx}`,
        description:
          "Yük testi amacıyla üretilmiş örnek ilan açıklamasıdır. Konum, ulaşım ve yatırım değeri yüksek. " +
          "Detaylı bilgi ve randevu için iletişime geçiniz. ".repeat(3),
        propertyType: type,
        listingType: "sale",
        status: "active",
        moderationStatus: "approved",
        price: ri(300, 9000) * 1000,
        currency: "TRY",
        district,
        neighborhood: `${ri(1, 45)}. Mahalle`,
        areaGross: area,
        areaNet: isLand ? null : Math.round(area * 0.85),
        rooms: isLand ? null : pick(ROOMS),
        heating: isLand ? null : pick(HEATING),
        zoningStatus: isLand ? pick(["Konut İmarlı", "Ticari İmarlı", "İmarsız"]) : null,
        featured: Math.random() < 0.08,
        verified: Math.random() < 0.25,
        lat: 39.0 + Math.random() * 0.8,
        lng: 28.9 + Math.random() * 1.2,
      };
    });
    await prisma.listing.createMany({ data: rows });
    done += n;
    process.stdout.write(`  ${done}/${COUNT}\r`);
  }

  const total = await prisma.listing.count();
  console.log(`\n✅ Bitti. Eklendi: ${COUNT}. Toplam ilan: ${total}.`);
}

main()
  .catch((e) => {
    console.error("HATA:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
