/**
 * Salt okunur veri denetimi — canlıda `seed:demo --reset` öncesi güvenlik kapısı.
 *
 * Neden ayrı bir script: sunucuda `psql` kurulu değil, dolayısıyla veritabanına
 * bakmanın tek yolu uygulamanın kendi Prisma istemcisi. Bu dosya HİÇBİR ŞEY
 * YAZMAZ; yalnız "silinecek olan gerçekten demo verisi mi" sorusunu yanıtlar.
 *
 * Kullanım:  npx tsx prisma/inspect-data.ts
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Seed'in üreteceği slug'lar — canlıda aynı slug'ı GERÇEK bir kayıt tutuyorsa
 *  upsert sessizce o kaydı güncelleyip demo ilanları ona bağlardı. */
const DEMO_AGENT_SLUGS = [
  "huseyin-yilmaz", "ayse-demir", "mehmet-kaya", "fatma-sahin",
  "ahmet-celik", "zeynep-aydin", "mustafa-dogan", "elif-arslan",
  "kemal-ozturk", "hatice-yildiz", "emre-koc", "merve-aslan",
];
const DEMO_AGENCY_SLUGS = [
  "evliya-gayrimenkul", "cini-emlak", "dumlupinar-yapi-emlak",
  "tavsanli-portfoy", "simav-konut", "gediz-emlak-ofisi",
];

async function main() {
  const [
    listings, images, favorites, conversations, messages, leads, alerts,
    users, realUsers, agents, realAgents, agencies, posts, testimonials,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listingImage.count(),
    prisma.favorite.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.lead.count(),
    prisma.buyerAlert.count(),
    prisma.user.count(),
    prisma.user.count({ where: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } }),
    prisma.agent.count(),
    prisma.agent.count({ where: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } }),
    prisma.agency.count(),
    prisma.post.count(),
    prisma.testimonial.count(),
  ]);

  // Sahibi demo hesap OLMAYAN ilan = gerçek olabilir; --reset bunu da siler.
  const atRisk = await prisma.listing.count({
    where: {
      AND: [
        { OR: [{ agentId: null }, { agent: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } }] },
        { OR: [{ userId: null }, { user: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } }] },
      ],
    },
  });

  const [agentClash, agencyClash] = await Promise.all([
    prisma.agent.findMany({
      where: { slug: { in: DEMO_AGENT_SLUGS }, NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } },
      select: { slug: true, email: true, name: true },
    }),
    // Agency'de e-posta zorunlu değil, "demo mu" ayrımı danışmanları üzerinden
    // yapılıyor: hiç demo olmayan danışmanı varsa gerçek bir ofistir.
    prisma.agency.findMany({
      where: {
        slug: { in: DEMO_AGENCY_SLUGS },
        agents: { some: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } },
      },
      select: { slug: true, name: true, createdAt: true },
    }),
  ]);

  const rows: [string, number | string][] = [
    ["Listing (toplam)", listings],
    ["Listing (sahibi demo DEĞİL = risk altında)", atRisk],
    ["ListingImage", images],
    ["Favorite", favorites],
    ["Conversation", conversations],
    ["Message", messages],
    ["Lead", leads],
    ["BuyerAlert", alerts],
    ["User (toplam / demo dışı)", `${users} / ${realUsers}`],
    ["Agent (toplam / demo dışı)", `${agents} / ${realAgents}`],
    ["Agency", agencies],
    ["Post", posts],
    ["Testimonial", testimonials],
  ];
  console.log("=== SAYIMLAR ===");
  for (const [label, value] of rows) console.log(`  ${label.padEnd(42)} ${value}`);

  console.log("\n=== SLUG ÇAKIŞMASI: demo slug'ını tutan GERÇEK kayıtlar (boş olmalı) ===");
  if (!agentClash.length && !agencyClash.length) {
    console.log("  yok");
  } else {
    for (const a of agentClash) console.log(`  DANIŞMAN  ${a.slug}  ${a.name}  ${a.email}`);
    for (const a of agencyClash) console.log(`  OFİS      ${a.slug}  ${a.name}  ${a.createdAt.toISOString().slice(0, 10)}`);
  }

  const safe = atRisk === 0 && !agentClash.length && !agencyClash.length;
  console.log(
    safe
      ? "\nSONUÇ: --reset yalnız demo verisini siler, devam edilebilir."
      : `\nSONUÇ: DİKKAT — ${atRisk} ilan, ${agentClash.length} danışman, ${agencyClash.length} ofis demo değil.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
