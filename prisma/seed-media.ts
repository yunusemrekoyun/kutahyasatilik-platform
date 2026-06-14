import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Medya yük testi için: gerçek WebP görseller (ana + thumb) üretir ve ilanlara bağlar.
// VPS'te çalıştırılır (UPLOAD_DIR diskine yazar, ListingImage satırlarını DB'ye ekler).
//   IMAGES=30 ATTACH=2000 tsx prisma/seed-media.ts   -> 30 görsel üret, 2000 ilana bağla
//   CLEAN=1 tsx prisma/seed-media.ts                  -> bağlanan test görsellerini (DB) sil
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const NUM_IMAGES = Number(process.env.IMAGES || 30);
const ATTACH = Number(process.env.ATTACH || 2000);
const PREFIX = "mediatest-";
const CLEAN = process.env.CLEAN === "1";

async function main() {
  if (CLEAN) {
    const r = await prisma.listingImage.deleteMany({ where: { url: { startsWith: `/uploads/${PREFIX}` } } });
    console.log(`🧹 ${r.count} test görsel kaydı silindi (DB). Diskteki dosyalar elle silinebilir.`);
    return;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: string[] = [];
  for (let i = 0; i < NUM_IMAGES; i++) {
    const base = `${PREFIX}${i}`;
    const bg = { r: (i * 53) % 256, g: (i * 97) % 256, b: (i * 151) % 256 };
    const [main, thumb] = await Promise.all([
      sharp({ create: { width: 1600, height: 1066, channels: 3, background: bg } }).webp({ quality: 82 }).toBuffer(),
      sharp({ create: { width: 800, height: 533, channels: 3, background: bg } }).webp({ quality: 70 }).toBuffer(),
    ]);
    await writeFile(path.join(UPLOAD_DIR, `${base}.webp`), main);
    await writeFile(path.join(UPLOAD_DIR, `${base}-thumb.webp`), thumb);
    urls.push(`/uploads/${base}.webp`);
  }
  console.log(`🖼️  ${NUM_IMAGES} WebP (ana+thumb) üretildi -> ${UPLOAD_DIR}`);

  const listings = await prisma.listing.findMany({
    select: { id: true },
    take: ATTACH,
    orderBy: { createdAt: "desc" },
  });
  await prisma.listingImage.deleteMany({
    where: { listingId: { in: listings.map((l) => l.id) }, url: { startsWith: `/uploads/${PREFIX}` } },
  });
  const rows = listings.map((l, i) => ({ listingId: l.id, url: urls[i % urls.length], sortOrder: 0 }));
  for (let s = 0; s < rows.length; s += 500) {
    await prisma.listingImage.createMany({ data: rows.slice(s, s + 500) });
  }
  console.log(`✅ ${rows.length} ilana görsel bağlandı. Test URL örneği: ${urls[0]} (+ ${urls[0].replace(".webp", "-thumb.webp")})`);
}

main()
  .catch((e) => {
    console.error("HATA:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
