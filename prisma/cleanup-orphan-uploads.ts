/**
 * Yetim upload temizleyicisi.
 *
 * `/api/upload/seller` dosyayı ilan kaydedilmeden ÖNCE diske yazar. Kullanıcı formu
 * göndermeden çıkarsa dosya kalıcı olarak yetim kalır; `deleteUploadFiles` yalnız
 * ilan silme/güncelleme akışlarından çağrıldığı için bunlara hiç dokunmaz.
 *
 * GÜVENLİK TASARIMI — bu script dosya siler, geri dönüşü yok:
 *
 * 1. Varsayılan KURU KOŞU. Silmek için açıkça `--apply` gerekir.
 * 2. Referans toplarken NE KOLON NE DE MODEL listesi elle tutuluyor. İlk sürümde
 *    modeller elle sayılmıştı ve 34 modelin 24'ü (District, AgentApplication,
 *    AdRequest, PortfolioOpportunity, Testimonial, Offer, Bid, Message...) hiç
 *    taranmıyordu — kuru koşu 27 gerçek yüklemeyi "yetim" gösterdi. Artık model
 *    listesi Prisma DMMF'inden geliyor ve her satır serileştirilip `/uploads/...`
 *    deseni aranıyor: CMS HTML gövdeleri, JSON dizileri ve serbest ayar değerleri
 *    kendiliğinden kapsanıyor.
 * 3. Yaş eşiği (varsayılan 48 saat) — az önce yüklenmiş, formu henüz gönderilmemiş
 *    dosyalar korunuyor.
 * 4. Emniyet supabı: hiç referans bulunamazsa script hata verip çıkar. Boş bir
 *    referans kümesi "her şey yetim" anlamına gelir ve neredeyse kesinlikle bir
 *    bağlantı/sorgu hatasıdır.
 *
 * Kullanım:
 *   npm run cleanup:uploads              # kuru koşu, ne silineceğini yazar
 *   npm run cleanup:uploads -- --apply   # gerçekten siler
 *   npm run cleanup:uploads -- --hours=72 --apply
 */
// dotenv/config: tsx .env'i KENDİLİĞİNDEN yüklemez. Bu satır olmadan
// DATABASE_URL boş kalıyor ve Supabase pooler "no tenant identifier" ile
// reddediyor. Diğer prisma scriptleri (rollup-analytics) de aynı kalıpta.
import "dotenv/config";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getUploadDir } from "../lib/uploads";

// lib/prisma "server-only" ve Next runtime'ı için kurulu; bakım scriptleri
// kendi istemcisini açar (projenin mevcut kalıbı).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const HOURS = Number(args.find((a) => a.startsWith("--hours="))?.split("=")[1] ?? 48);

/**
 * Yüksek hacimli, upload referansı taşımayan zaman serileri. ATLANANLAR AÇIKÇA
 * LOGLANIR — sessiz kapsam daraltması, "hepsini taradık" yanılsaması yaratır.
 */
const SKIPPED_MODELS = new Set(["AnalyticsEvent", "AnalyticsDaily", "PushDelivery"]);

/** Model listesi DMMF'ten: elle tutulan liste bir modeli atlamaya açıktı. */
async function collectReferencedFiles(): Promise<Set<string>> {
  const rows: unknown[] = [];
  const counts: string[] = [];
  const skipped: string[] = [];

  // Prisma 7'nin prisma-client generator'ında `Prisma.dmmf` YOK; model listesi
  // `Prisma.ModelName` sabitinden geliyor (34 model).
  for (const modelName of Object.keys(Prisma.ModelName)) {
    if (SKIPPED_MODELS.has(modelName)) {
      skipped.push(modelName);
      continue;
    }
    // Delegate adı modelin baş harfi küçük hâli (Prisma sözleşmesi).
    const key = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const delegate = (prisma as unknown as Record<string, { findMany?: () => Promise<unknown[]> }>)[key];
    if (!delegate?.findMany) {
      skipped.push(`${modelName}(delegate yok)`);
      continue;
    }
    // Sırayla: pooler'a onlarca eşzamanlı sorgu açmaya gerek yok.
    const result = await delegate.findMany();
    rows.push(...result);
    counts.push(`${key}:${result.length}`);
  }

  console.log(`Taranan model: ${counts.length}  Atlanan: ${skipped.join(", ") || "yok"}`);
  console.log("Kayıtlar:", counts.join(" "));

  const referenced = new Set<string>();
  const pattern = /\/uploads\/([A-Za-z0-9._-]+)/g;
  for (const row of rows) {
    const text = JSON.stringify(row);
    for (const match of text.matchAll(pattern)) {
      const name = match[1];
      referenced.add(name);
      // Küçük varyant kapağın yanında yaşıyor; biri referanslıysa ikisi de korunur.
      if (name.endsWith(".webp") && !name.endsWith("-thumb.webp")) {
        referenced.add(name.replace(/\.webp$/, "-thumb.webp"));
      }
      if (name.endsWith("-thumb.webp")) {
        referenced.add(name.replace(/-thumb\.webp$/, ".webp"));
      }
    }
  }
  return referenced;
}

async function main() {
  const dir = getUploadDir();
  console.log(`Upload dizini : ${dir}`);
  console.log(`Yaş eşiği     : ${HOURS} saat`);
  console.log(`Mod           : ${APPLY ? "SİLME (--apply)" : "kuru koşu"}`);

  const referenced = await collectReferencedFiles();
  console.log(`Referanslı dosya: ${referenced.size}`);

  // Emniyet supabı: boş referans kümesi = her dosya yetim görünür. Bu neredeyse
  // her zaman bir bağlantı/sorgu hatasıdır, temizlik değil.
  if (referenced.size === 0) {
    console.error("HATA: hiç referans bulunamadı. Silme yapılmadı — DATABASE_URL doğru mu?");
    process.exitCode = 1;
    return;
  }

  let entries: string[];
  try {
    entries = await readdir(/*turbopackIgnore: true*/ dir);
  } catch {
    console.error(`HATA: upload dizini okunamadı: ${dir}`);
    process.exitCode = 1;
    return;
  }

  const cutoff = Date.now() - HOURS * 3600_000;
  const orphans: { name: string; bytes: number; ageHours: number }[] = [];

  for (const name of entries) {
    // Gizli dosyalar (.gitkeep gibi) dizin iskeletidir, içerik değil.
    if (name.startsWith(".")) continue;
    if (referenced.has(name)) continue;
    const full = path.join(dir, name);
    let info;
    try {
      info = await stat(/*turbopackIgnore: true*/ full);
    } catch {
      continue;
    }
    if (!info.isFile()) continue;
    if (info.mtimeMs > cutoff) continue; // yeterince eski değil
    orphans.push({
      name,
      bytes: info.size,
      ageHours: Math.round((Date.now() - info.mtimeMs) / 3600_000),
    });
  }

  const totalBytes = orphans.reduce((sum, o) => sum + o.bytes, 0);
  console.log(`\nYetim dosya: ${orphans.length} (${(totalBytes / 1048576).toFixed(1)} MB)`);
  for (const o of orphans.slice(0, 50)) {
    console.log(`  ${o.name}  ${(o.bytes / 1024).toFixed(0)} KB  ${o.ageHours} saat`);
  }
  if (orphans.length > 50) console.log(`  ... ve ${orphans.length - 50} dosya daha`);

  if (!APPLY) {
    console.log("\nKuru koşu — hiçbir dosya silinmedi. Silmek için: --apply");
    return;
  }

  let deleted = 0;
  for (const o of orphans) {
    try {
      await unlink(/*turbopackIgnore: true*/ path.join(dir, o.name));
      deleted++;
    } catch {
      console.warn(`  silinemedi: ${o.name}`);
    }
  }
  console.log(`\n${deleted} dosya silindi.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
