import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const DISTRICT_DATA = [
  {
    name: "Merkez", slug: "merkez", lat: 39.4242, lng: 29.9833, sortOrder: 1,
    investmentScore: 84, valueGrowth3yPct: 42, valueGrowth5yPct: 78,
    avgPriceDaire: 2750000, avgPriceArsaM2: 4500,
    description:
      "Kütahya Merkez, ilin idari, ticari ve eğitim merkezidir. Dumlupınar Üniversitesi'nin öğrenci nüfusu, sürekli kira ve konut talebi yaratır. Çinili Cami, kale ve gelişen konut projeleriyle merkez, hem oturum hem yatırım için en likit bölgedir.",
    transportNote:
      "Şehir içi ulaşım ağının merkezi konumunda; Eskişehir ve Afyon yönündeki bağlantı yolları ile çevre yolu projeleri bölge değerini desteklemektedir.",
    nearbySchools: JSON.stringify(["Kütahya Dumlupınar Üniversitesi", "Fatih Anadolu Lisesi", "Merkez Atatürk İlkokulu", "Gazi Kemal Ortaokulu"]),
    nearbyHospitals: JSON.stringify(["Kütahya Şehir Hastanesi", "Evliya Çelebi Eğitim ve Araştırma Hastanesi", "Özel Murat Hüdavendigar Hastanesi"]),
  },
  {
    name: "Tavşanlı", slug: "tavsanli", lat: 39.5469, lng: 29.4936, sortOrder: 2,
    investmentScore: 74, valueGrowth3yPct: 35, valueGrowth5yPct: 64,
    avgPriceDaire: 1650000, avgPriceArsaM2: 2200,
    description:
      "Tavşanlı, Kütahya'nın en büyük ilçelerinden biridir ve linyit madenciliği ile termik santral istihdamı sayesinde güçlü bir yerel ekonomiye sahiptir. İstikrarlı konut talebi yatırımcı için öngörülebilir getiri sağlar.",
    transportNote:
      "Bursa ve Kütahya merkez bağlantıları güçlüdür; sanayi ve madencilik istihdamı konut talebini canlı tutar.",
    nearbySchools: JSON.stringify(["Tavşanlı Anadolu Lisesi", "TKİ Ortaokulu", "Şehit Pilot İlkokulu"]),
    nearbyHospitals: JSON.stringify(["Tavşanlı Doç. Dr. Mustafa Kalemli Devlet Hastanesi"]),
  },
  {
    name: "Simav", slug: "simav", lat: 39.0894, lng: 28.9783, sortOrder: 3,
    investmentScore: 71, valueGrowth3yPct: 33, valueGrowth5yPct: 60,
    avgPriceDaire: 1450000, avgPriceArsaM2: 1900,
    description:
      "Simav, termal kaynakları ve jeotermal ısıtma altyapısıyla öne çıkar. Termal turizm ve sağlık yatırımları bölgeye ek talep getirir; özellikle termal bölgelerdeki arsalar yatırım açısından değerlidir.",
    transportNote:
      "Termal turizm yatırımları ve jeotermal ısıtma ağı bölge konutlarına ek cazibe katar.",
    nearbySchools: JSON.stringify(["Simav Anadolu Lisesi", "Eynal Ortaokulu"]),
    nearbyHospitals: JSON.stringify(["Simav Devlet Hastanesi"]),
  },
  {
    name: "Gediz", slug: "gediz", lat: 39.0411, lng: 29.4144, sortOrder: 4,
    investmentScore: 68, valueGrowth3yPct: 30, valueGrowth5yPct: 55,
    avgPriceDaire: 1350000, avgPriceArsaM2: 1700,
    description:
      "Gediz, kaplıcaları ve tarımsal üretimiyle bilinen, yeniden yapılanmış modern bir ilçe merkezine sahiptir. Murat Dağı kayak ve termal tesisleri turizm potansiyelini artırmaktadır.",
    transportNote:
      "Murat Dağı turizm tesisleri ve kaplıca yatırımları bölgenin orta vadeli değerini destekler.",
    nearbySchools: JSON.stringify(["Gediz Anadolu Lisesi", "Cumhuriyet Ortaokulu"]),
    nearbyHospitals: JSON.stringify(["Gediz Devlet Hastanesi"]),
  },
  {
    name: "Emet", slug: "emet", lat: 39.3447, lng: 29.2603, sortOrder: 5,
    investmentScore: 66, valueGrowth3yPct: 29, valueGrowth5yPct: 52,
    avgPriceDaire: 1250000, avgPriceArsaM2: 1500,
    description:
      "Emet, bor madenciliği ve termal kaynaklarıyla öne çıkan, doğal güzelliklere sahip bir ilçedir. Bor işletmelerinin istihdamı ve termal tesisler bölge ekonomisini canlı tutar.",
    transportNote:
      "Bor madenciliği istihdamı ve termal tesis yatırımları konut talebini destekler.",
    nearbySchools: JSON.stringify(["Emet Anadolu Lisesi", "Atatürk İlkokulu"]),
    nearbyHospitals: JSON.stringify(["Emet Devlet Hastanesi"]),
  },
  { name: "Domaniç", slug: "domanic", lat: 39.8003, lng: 29.6042, sortOrder: 6, investmentScore: 62, valueGrowth3yPct: 27, valueGrowth5yPct: 48, avgPriceArsaM2: 1200 },
  { name: "Hisarcık", slug: "hisarcik", lat: 39.2503, lng: 29.2331, sortOrder: 7, investmentScore: 60, valueGrowth3yPct: 26, valueGrowth5yPct: 46, avgPriceArsaM2: 1100 },
  { name: "Altıntaş", slug: "altintas", lat: 39.0686, lng: 30.1108, sortOrder: 8, investmentScore: 64, valueGrowth3yPct: 31, valueGrowth5yPct: 56, avgPriceArsaM2: 1350 },
  { name: "Aslanapa", slug: "aslanapa", lat: 39.2167, lng: 29.8667, sortOrder: 9, investmentScore: 58, valueGrowth3yPct: 25, valueGrowth5yPct: 44 },
  { name: "Dumlupınar", slug: "dumlupinar", lat: 39.0667, lng: 29.95, sortOrder: 10, investmentScore: 57, valueGrowth3yPct: 24, valueGrowth5yPct: 43 },
  { name: "Çavdarhisar", slug: "cavdarhisar", lat: 39.2089, lng: 29.6164, sortOrder: 11, investmentScore: 59, valueGrowth3yPct: 26, valueGrowth5yPct: 45 },
  { name: "Pazarlar", slug: "pazarlar", lat: 39.2667, lng: 29.3667, sortOrder: 12, investmentScore: 56, valueGrowth3yPct: 24, valueGrowth5yPct: 42 },
  { name: "Şaphane", slug: "saphane", lat: 39.0322, lng: 29.215, sortOrder: 13, investmentScore: 55, valueGrowth3yPct: 23, valueGrowth5yPct: 41 },
];

function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

const LISTINGS = [
  {
    slug: "kutahya-merkez-fatih-3-1-satilik-daire",
    title: "Merkez Fatih Mahallesi'nde Sıfır 3+1 Satılık Daire",
    description:
      "Şehrin merkezinde, ulaşıma ve tüm sosyal donatılara yürüme mesafesinde, yeni yapılmış lüks bir sitede 3+1 daire. Geniş salon, ebeveyn banyolu yatak odası, ankastre mutfak ve kapalı otopark. Yatırım ve oturum için ideal.",
    propertyType: "daire", price: 3250000, district: "Merkez", neighborhood: "Fatih",
    lat: 39.4205, lng: 29.985, areaGross: 135, areaNet: 120, rooms: "3+1",
    floor: "3", totalFloors: 6, buildingAge: "0 (Sıfır)", heating: "Doğalgaz (Kombi)",
    furnished: false, inSite: true, balcony: true, parking: true, featured: true,
    investmentScore: 88, valueGrowthPct: 42,
    features: JSON.stringify(["Asansör", "Kapalı Otopark", "Site İçi", "Güvenlik", "Çocuk Parkı", "Ankastre Mutfak"]),
    images: ["daire1a", "daire1b", "daire1c"],
  },
  {
    slug: "kutahya-merkez-yatirimlik-imarli-arsa",
    title: "Merkez'e Yakın İmarlı Yatırımlık Arsa - 850 m²",
    description:
      "Gelişmekte olan bölgede, konut imarlı, yola cepheli 850 m² arsa. KAKS 1.50, ayrık nizam. Yatırım için yüksek değer kazanma potansiyeli taşıyan, tapusu temiz fırsat arsa.",
    propertyType: "arsa", price: 2950000, district: "Merkez", neighborhood: "30 Ağustos",
    lat: 39.43, lng: 29.97, areaGross: 850, deedStatus: "Hisseli Değil (Müstakil Tapu)",
    zoningStatus: "Konut İmarlı", adaNo: "1245", parselNo: "17", kaks: "1.50", featured: true,
    investmentScore: 82, valueGrowthPct: 45,
    features: JSON.stringify(["Yola Cepheli", "İmarlı", "Elektrik", "Su", "Doğalgaz Hattı"]),
    images: ["arsa1a", "arsa1b"],
  },
  {
    slug: "kutahya-merkez-mustakil-bahceli-villa",
    title: "Merkez'de Müstakil Bahçeli Lüks Villa - 4+2",
    description:
      "Doğayla iç içe, 600 m² bahçe içinde 280 m² kullanım alanlı müstakil villa. 4+2, şömineli salon, kapalı garaj, akıllı ev sistemi. Aileler için huzurlu ve prestijli yaşam.",
    propertyType: "villa", price: 8750000, district: "Merkez", neighborhood: "Yıldırım Beyazıt",
    lat: 39.415, lng: 29.99, areaGross: 280, areaNet: 250, rooms: "4+2",
    totalFloors: 2, buildingAge: "2", heating: "Yerden Isıtma (Doğalgaz)",
    furnished: false, balcony: true, parking: true, featured: true,
    investmentScore: 80, valueGrowthPct: 38,
    features: JSON.stringify(["Müstakil", "Bahçeli", "Şömine", "Kapalı Garaj", "Akıllı Ev", "Güvenlik"]),
    images: ["villa1a", "villa1b", "villa1c"],
  },
  {
    slug: "tavsanli-3-1-satilik-daire",
    title: "Tavşanlı Merkez'de Bakımlı 3+1 Satılık Daire",
    description:
      "Tavşanlı çarşı merkezine yakın, asansörlü binada 3+1 geniş daire. Doğalgazlı, güney cephe, ferah ve aydınlık. Aileler için kullanışlı konum.",
    propertyType: "daire", price: 1750000, district: "Tavşanlı", neighborhood: "Yeni",
    lat: 39.547, lng: 29.495, areaGross: 125, areaNet: 110, rooms: "3+1",
    floor: "2", totalFloors: 5, buildingAge: "8", heating: "Doğalgaz (Kombi)",
    balcony: true, parking: false,
    features: JSON.stringify(["Asansör", "Güney Cephe", "Doğalgaz"]),
    images: ["tav1a", "tav1b"],
  },
  {
    slug: "simav-termal-bolge-yatirimlik-arsa",
    title: "Simav Eynal Termal Bölgesinde Yatırımlık Arsa",
    description:
      "Termal turizm bölgesinde, yatırım için ideal konumda arsa. Termal tesis ve konut yatırımlarına yakın. Değer kazanma potansiyeli yüksek.",
    propertyType: "tarla", price: 1850000, district: "Simav", neighborhood: "Eynal",
    lat: 39.092, lng: 28.98, areaGross: 2000, deedStatus: "Müstakil Tapu",
    zoningStatus: "İmara Açık", investmentScore: 75, valueGrowthPct: 40,
    features: JSON.stringify(["Termal Bölge", "Yola Yakın", "Yatırımlık"]),
    images: ["simav1a", "simav1b"],
  },
  {
    slug: "gediz-satilik-bahceli-mustakil-ev",
    title: "Gediz'de Bahçeli Müstakil Ev - Kaplıcalara Yakın",
    description:
      "Gediz merkezde, müstakil tapulu, bahçeli ev. Kaplıca tesislerine yakın, sakin bir mahallede. Tadilatlı ve oturuma hazır.",
    propertyType: "mustakil", price: 1450000, district: "Gediz", neighborhood: "Cumhuriyet",
    lat: 39.041, lng: 29.414, areaGross: 160, rooms: "3+1", buildingAge: "15",
    balcony: false, parking: true,
    features: JSON.stringify(["Müstakil", "Bahçeli", "Tadilatlı"]),
    images: ["gediz1a"],
  },
  {
    slug: "emet-yatirimlik-tarla",
    title: "Emet'te Yola Cepheli Yatırımlık Tarla - 5000 m²",
    description:
      "Ana yola cepheli, geniş yatırımlık tarla. Tarımsal üretim veya uzun vadeli yatırım için uygun. Müstakil tapulu.",
    propertyType: "tarla", price: 950000, district: "Emet", neighborhood: "Merkez",
    lat: 39.345, lng: 29.26, areaGross: 5000, deedStatus: "Müstakil Tapu",
    zoningStatus: "Tarla Vasfı", investmentScore: 68, valueGrowthPct: 32,
    features: JSON.stringify(["Yola Cepheli", "Geniş Alan", "Yatırımlık"]),
    images: ["emet1a"],
  },
  {
    slug: "kutahya-merkez-2-1-ogrenci-yatirimlik-daire",
    title: "Üniversiteye Yakın 2+1 Yatırımlık (Kiralık Getirili) Daire",
    description:
      "Dumlupınar Üniversitesi'ne yakın, sürekli kiracı bulan 2+1 daire. Yatırımcı için yüksek kira getirisi. Eşyalı satılabilir.",
    propertyType: "daire", price: 1950000, district: "Merkez", neighborhood: "Evliya Çelebi",
    lat: 39.435, lng: 29.96, areaGross: 95, areaNet: 82, rooms: "2+1",
    floor: "4", totalFloors: 7, buildingAge: "5", heating: "Doğalgaz (Kombi)",
    furnished: true, balcony: true, parking: false,
    investmentScore: 79, valueGrowthPct: 36,
    features: JSON.stringify(["Asansör", "Eşyalı", "Üniversiteye Yakın", "Yüksek Kira Getirisi"]),
    images: ["ogr1a", "ogr1b"],
  },
];

async function main() {
  console.log("🌱 Seed başlıyor...");

  // Admin
  const email = (process.env.ADMIN_EMAIL || "admin@kutahyasatilik.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Seed için en az 12 karakterlik ADMIN_PASSWORD ortam değişkeni gereklidir.");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Yönetici" },
  });
  console.log(`👤 Admin hesabı hazırlandı: ${email}`);

  // Settings — iletişim numarası sahte SEED'lenmez (admin > Ayarlar'dan girilir; boşsa buton gizli).
  const settings: Record<string, string> = {
    phone: "",
    whatsapp: "",
    email: "info@kutahyasatilik.com",
    brand: "Kütahya'nın Dijital Emlak Ofisi",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // İlçeler
  for (const d of DISTRICT_DATA) {
    await prisma.district.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    });
  }
  console.log(`📍 ${DISTRICT_DATA.length} ilçe verisi yüklendi`);

  // İlanlar (temiz başlangıç için önce sil)
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  for (const l of LISTINGS) {
    const { images, ...data } = l;
    await prisma.listing.create({
      data: {
        ...data,
        metaTitle: `${l.title} | Kütahya Satılık`,
        metaDescription: l.description.slice(0, 155),
        images: {
          create: images.map((seed, i) => ({ url: img(seed), sortOrder: i, alt: l.title })),
        },
      },
    });
  }
  console.log(`🏠 ${LISTINGS.length} ilan yüklendi`);
  console.log("✅ Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
