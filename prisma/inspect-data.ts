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

  // Sahiplik dağılımı. "Sahipsiz" tek başına gerçek/demo ayrımı YAPMAZ: önceki
  // seed sürümü sahip atamıyordu, dolayısıyla eski demo katalogu da sahipsizdir.
  const [withAgent, withUser, ownerless] = await Promise.all([
    prisma.listing.count({ where: { agentId: { not: null } } }),
    prisma.listing.count({ where: { userId: { not: null } } }),
    prisma.listing.count({ where: { agentId: null, userId: null } }),
  ]);

  // AYIRT EDİCİ İŞARET: demo katalogun görselleri "/uploads/demo-<konu>-<n>.jpg"
  // adıyla üretiliyor. Gerçek bir ilanın görseli yükleme akışından geçtiği için
  // asla bu deseni taşımaz. Görseli olmayan ilan da şüpheli sayılır.
  const demoLooking = await prisma.listing.count({
    where: { images: { some: { url: { startsWith: "/uploads/demo-" } } } },
  });
  const nonDemoImage = await prisma.listing.count({
    where: { images: { some: { NOT: { url: { startsWith: "/uploads/demo-" } } } } },
  });
  const noImage = await prisma.listing.count({ where: { images: { none: {} } } });

  // Demo hesap sahipliği (yeni seed sürümünün bıraktığı iz).
  const atRisk = await prisma.listing.count({
    where: {
      AND: [
        { OR: [{ agentId: null }, { agent: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } }] },
        { OR: [{ userId: null }, { user: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } } }] },
      ],
    },
  });

  // Gerçek görünen hesaplar — kimlikler maskeli (log paylaşımı için).
  const mask = (value: string | null) => {
    if (!value) return "-";
    const [name, domain] = value.split("@");
    return domain ? `${name.slice(0, 2)}***@${domain}` : `${value.slice(0, 2)}***`;
  };
  const [realUserRows, realAgentRows, agencyRows] = await Promise.all([
    prisma.user.findMany({
      where: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } },
      select: { email: true, createdAt: true, _count: { select: { listings: true, favorites: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agent.findMany({
      where: { NOT: { email: { endsWith: "@demo.kutahyasatilik.com" } } },
      select: { email: true, slug: true, status: true, createdAt: true, _count: { select: { listings: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agency.findMany({
      select: { slug: true, name: true, status: true, createdAt: true, _count: { select: { listings: true, agents: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

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
    ["  \u2514 demo hesap sahipli", listings - atRisk],
    ["  \u2514 danışmanlı / kullanıcılı / sahipsiz", `${withAgent} / ${withUser} / ${ownerless}`],
    ["  \u2514 demo görselli (silinmesi güvenli)", demoLooking],
    ["  \u2514 GERÇEK görselli (İNCELE)", nonDemoImage],
    ["  \u2514 hiç görseli yok (İNCELE)", noImage],
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

  console.log("\n=== DEMO OLMAYAN HESAPLAR (--reset bunlara DOKUNMAZ) ===");
  for (const u of realUserRows) {
    console.log(`  KULLANICI ${mask(u.email).padEnd(28)} ${u.createdAt.toISOString().slice(0, 10)}  ilan=${u._count.listings} favori=${u._count.favorites}`);
  }
  for (const a of realAgentRows) {
    console.log(`  DANIŞMAN  ${mask(a.email).padEnd(28)} ${a.createdAt.toISOString().slice(0, 10)}  slug=${a.slug} durum=${a.status} ilan=${a._count.listings}`);
  }
  for (const a of agencyRows) {
    console.log(`  OFİS      ${a.name.slice(0, 26).padEnd(28)} ${a.createdAt.toISOString().slice(0, 10)}  slug=${a.slug} durum=${a.status} ilan=${a._count.listings} danışman=${a._count.agents}`);
  }
  if (!realUserRows.length && !realAgentRows.length && !agencyRows.length) console.log("  yok");

  // Karar YALNIZ görsel parmak izine dayanıyor: sahipsizlik eski seed sürümünün
  // de izi olduğu için tek başına kanıt değil.
  const suspicious = nonDemoImage + noImage;
  const safe = suspicious === 0 && !agentClash.length && !agencyClash.length;
  console.log(
    safe
      ? `\nSONUÇ: ${demoLooking} ilanın tamamı demo görselli. --reset güvenli, devam edilebilir.`
      : `\nSONUÇ: DİKKAT — ${suspicious} ilan demo parmak izi taşımıyor (${nonDemoImage} gerçek görselli, ${noImage} görselsiz). Silmeden önce incele.`,
  );

  if (suspicious > 0) {
    const samples = await prisma.listing.findMany({
      where: {
        OR: [
          { images: { some: { NOT: { url: { startsWith: "/uploads/demo-" } } } } },
          { images: { none: {} } },
        ],
      },
      select: { slug: true, title: true, category: true, createdAt: true, images: { select: { url: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("\n=== ŞÜPHELİ İLANLARDAN ÖRNEKLER (en yeni 10) ===");
    for (const s of samples) {
      console.log(`  ${s.createdAt.toISOString().slice(0, 10)}  ${s.category.padEnd(10)} ${s.title.slice(0, 52).padEnd(54)} ${s.images[0]?.url ?? "(görselsiz)"}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
