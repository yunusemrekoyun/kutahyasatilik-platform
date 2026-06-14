import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// AnalyticsEvent retention/arşiv: RETENTION_DAYS'ten eski ham event'leri
// (gün, tip, ilçe) bazında AnalyticsDaily özetine yazar ve ham tablodan siler.
// Cron ile günlük çalıştırın. Tarih korunur, AnalyticsEvent sınırsız büyümez.
//   RETENTION_DAYS=90 tsx prisma/rollup-analytics.ts
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS || 90);

async function main() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
  const old = await prisma.analyticsEvent.count({ where: { createdAt: { lt: cutoff } } });
  if (old === 0) {
    console.log(`Özetlenecek (>${RETENTION_DAYS} gün) ham event yok.`);
    return;
  }
  // Özetle + sil TEK transaction (yarıda kalırsa ne çift sayım ne veri kaybı).
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO "AnalyticsDaily" (id, date, type, district, count)
      SELECT gen_random_uuid()::text, date_trunc('day', "createdAt"), type, COALESCE(district, ''), COUNT(*)::int
      FROM "AnalyticsEvent"
      WHERE "createdAt" < ${cutoff}
      GROUP BY date_trunc('day', "createdAt"), type, COALESCE(district, '')
      ON CONFLICT (date, type, district) DO UPDATE SET count = "AnalyticsDaily".count + EXCLUDED.count
    `,
    prisma.$executeRaw`DELETE FROM "AnalyticsEvent" WHERE "createdAt" < ${cutoff}`,
  ]);
  console.log(`✅ ${old} eski event özetlenip ham tablodan silindi (>${RETENTION_DAYS} gün).`);
}

main().catch((e) => { console.error("HATA:", e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
