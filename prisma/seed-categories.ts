// Vasıta ve teknoloji kategorileri için demo ilanları.
//
// Bağımsız çalışır: `npm run seed:categories`. Aynı slug varsa günceller, yani
// tekrar çalıştırmak veri çoğaltmaz.
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type DemoListing = {
  slug: string;
  title: string;
  description: string;
  category: "vasita" | "teknoloji";
  propertyType: string;
  price: number;
  district: string;
  neighborhood?: string;
  featured?: boolean;
  attributes: Record<string, string | number>;
};

const LISTINGS: DemoListing[] = [
  {
    slug: "2019-renault-clio-1-5-dci-touch",
    title: "2019 Renault Clio 1.5 dCi Touch — Tek Elden, Bakımlı",
    description:
      "Aile aracı olarak kullanıldı, tüm bakımları yetkili serviste yapıldı. Dizel motoru ile şehir içi 4,2 lt ortalama veriyor. Lastikleri bu yıl değişti, muayenesi 2027'ye kadar geçerli. Takas düşünülmez, pazarlık payı vardır.",
    category: "vasita",
    propertyType: "otomobil",
    price: 785000,
    district: "Merkez",
    neighborhood: "Alipaşa",
    featured: true,
    attributes: { marka: "Renault", model: "Clio 1.5 dCi Touch", yil: 2019, kilometre: 118000, yakit: "dizel", vites: "manuel", renk: "Beyaz", hasar: "hasarsiz" },
  },
  {
    slug: "2021-fiat-egea-1-6-multijet-lounge",
    title: "2021 Fiat Egea 1.6 Multijet Lounge — Otomatik",
    description:
      "Boyasız değişensiz, garaj arabası. Geniş bagajı ve otomatik şanzımanı ile uzun yol konforu üst düzey. Servis bakım kayıtları eksiksiz teslim edilir.",
    category: "vasita",
    propertyType: "otomobil",
    price: 1045000,
    district: "Merkez",
    neighborhood: "Bölcek",
    attributes: { marka: "Fiat", model: "Egea 1.6 Multijet Lounge", yil: 2021, kilometre: 64500, yakit: "dizel", vites: "otomatik", renk: "Gri", hasar: "hasarsiz" },
  },
  {
    slug: "2016-ford-transit-350l-panelvan",
    title: "2016 Ford Transit 350L Panelvan — Nakliyeye Hazır",
    description:
      "Uzun şasi panelvan, yük bölmesi ahşap kaplı. Esnaf aracı olarak kullanıldı, motor ve şanzıman sorunsuz. Ağır vasıta işleri için uygundur, yerinde görülebilir.",
    category: "vasita",
    propertyType: "ticari",
    price: 890000,
    district: "Tavşanlı",
    attributes: { marka: "Ford", model: "Transit 350L", yil: 2016, kilometre: 297000, yakit: "dizel", vites: "manuel", renk: "Beyaz", hasar: "boyali" },
  },
  {
    slug: "2014-new-holland-td-75d-traktor",
    title: "2014 New Holland TD 75D Traktör — Çift Çeker",
    description:
      "Tarla ve bağ işlerinde kullanıldı. Çift çeker, kabinli, klimalı. Ön yükleyici ataşmanı ile birlikte verilir. Hidrolik sistem yeni revize edildi.",
    category: "vasita",
    propertyType: "traktor",
    price: 675000,
    district: "Altıntaş",
    featured: true,
    attributes: { marka: "New Holland", model: "TD 75D", yil: 2014, kilometre: 6400, yakit: "dizel", vites: "manuel", renk: "Mavi", hasar: "hasarsiz" },
  },
  {
    slug: "2022-honda-cb-125r-motosiklet",
    title: "2022 Honda CB 125R — 9.000 km, Garantili",
    description:
      "İkinci sahibinden, düşük kilometreli. Şehir içi kullanım için ideal, yakıt tüketimi çok düşük. Kask ve orijinal aksesuarları ile birlikte verilecektir.",
    category: "vasita",
    propertyType: "motosiklet",
    price: 168000,
    district: "Merkez",
    neighborhood: "Yıldırım Beyazıt",
    attributes: { marka: "Honda", model: "CB 125R", yil: 2022, kilometre: 9000, yakit: "benzin", vites: "manuel", renk: "Kırmızı", hasar: "hasarsiz" },
  },
  {
    slug: "iphone-14-pro-256-gb-garantili",
    title: "iPhone 14 Pro 256 GB — Apple Türkiye Garantili",
    description:
      "Kutusunda, tüm aksesuarları tam. Batarya sağlığı %91. Ekranında ve kasasında çizik yok, ilk günden beri kılıf ve ekran koruyucu ile kullanıldı. Faturası mevcuttur.",
    category: "teknoloji",
    propertyType: "telefon",
    price: 42500,
    district: "Merkez",
    neighborhood: "Cedit",
    featured: true,
    attributes: { marka: "Apple", model: "iPhone 14 Pro 256 GB", durum: "ikinci_el", garanti: "var", kutu: "tam" },
  },
  {
    slug: "macbook-air-m2-16-gb-512-gb",
    title: "MacBook Air M2 16 GB / 512 GB — Az Kullanılmış",
    description:
      "Üniversite döneminde kullanıldı, şarj döngüsü 140. Performansı sıfır gibi, ısınma yapmıyor. Kutusu, orijinal şarj adaptörü ve kablosu mevcut.",
    category: "teknoloji",
    propertyType: "bilgisayar",
    price: 47000,
    district: "Merkez",
    attributes: { marka: "Apple", model: "MacBook Air M2", durum: "ikinci_el", garanti: "yok", kutu: "tam" },
  },
  {
    slug: "playstation-5-slim-dijital-surum",
    title: "PlayStation 5 Slim Dijital Sürüm — Sıfır, Kapalı Kutu",
    description:
      "Hediye geldi, hiç açılmadı. Kutusu kapalı ve orijinal bandı duruyor. Faturası ile birlikte, distribütör garantisi devam ediyor.",
    category: "teknoloji",
    propertyType: "konsol",
    price: 24900,
    district: "Simav",
    attributes: { marka: "Sony", model: "PlayStation 5 Slim Digital", durum: "sifir", garanti: "var", kutu: "tam" },
  },
  {
    slug: "canon-eos-r10-18-45-kit",
    title: "Canon EOS R10 + 18-45 mm Kit — 4.200 Deklanşör",
    description:
      "Hobi amaçlı kullanıldı, çok az deklanşör var. Aynasız gövde, 4K video desteği. İki batarya, çanta ve 128 GB hafıza kartı ile birlikte verilir.",
    category: "teknoloji",
    propertyType: "kamera",
    price: 38500,
    district: "Merkez",
    neighborhood: "Servi",
    attributes: { marka: "Canon", model: "EOS R10", durum: "ikinci_el", garanti: "yok", kutu: "tam" },
  },
  {
    slug: "samsung-galaxy-tab-s9-fe-128-gb",
    title: "Samsung Galaxy Tab S9 FE 128 GB — Kalemi Dahil",
    description:
      "Ders notu ve çizim için kullanıldı. S Pen kalemi dahildir. Ekranı çiziksiz, batarya performansı tam. Kutusu ve şarj kablosu mevcut.",
    category: "teknoloji",
    propertyType: "tablet",
    price: 18750,
    district: "Gediz",
    attributes: { marka: "Samsung", model: "Galaxy Tab S9 FE 128 GB", durum: "ikinci_el", garanti: "var", kutu: "tam" },
  },
];

async function main() {
  for (const item of LISTINGS) {
    const data = {
      title: item.title,
      description: item.description,
      category: item.category,
      propertyType: item.propertyType,
      listingType: "sale",
      status: "active",
      // Demo ilanları doğrudan yayında: sunumda onay kuyruğunu beklemesinler.
      moderationStatus: "approved",
      price: item.price,
      currency: "TRY",
      district: item.district,
      neighborhood: item.neighborhood ?? null,
      featured: item.featured ?? false,
      attributes: item.attributes,
    };

    await prisma.listing.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    console.log(`  ✓ ${item.title}`);
  }

  const counts = await prisma.listing.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  console.log("\nKategori dağılımı:");
  for (const row of counts) {
    console.log(`  ${row.category}: ${row._count._all}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
