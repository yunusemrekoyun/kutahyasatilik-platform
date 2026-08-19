/**
 * Sunum/demo kataloğu — kapsamlı ve tutarlı ilan seti.
 *
 * Neden ayrı bir script: mevcut `seed` 8 ilanlık minimum set, `seed-categories`
 * ise 10 ilanlık kategori örneği. Sunum için gerçek bir katalog hissi lazım:
 * her ilçede, her alt türde, fiyat aralığı geniş, görselli.
 *
 * GÖRSELLER: dış host'a bağlanmıyoruz. `next.config.ts` remotePatterns yalnız
 * kendi medya host'umuza izin veriyor (picsum/unsplash bilerek kaldırılmıştı) ve
 * bu daraltmayı geri almak istemiyoruz. Onun yerine kategoriye uygun görseller
 * bir kez UPLOAD_DIR'e indiriliyor, ilanlar `/uploads/...` ile onlara bağlanıyor.
 *
 * Kullanım:
 *   npm run seed:demo            # mevcut ilanların ÜSTÜNE ekler
 *   npm run seed:demo -- --reset # önce TÜM ilanları siler
 *   npm run seed:demo -- --count=400
 *   npm run seed:demo -- --no-images
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { listingAmenityRows } from "../lib/listingAmenities";
import { sortableAttributeColumns } from "../lib/categories";
import { loadCatalog, prepareCatalogImages, type PreparedItem } from "./demo-images";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const args = process.argv.slice(2);
const RESET = args.includes("--reset");
const NO_IMAGES = args.includes("--no-images");
const TOTAL = Number(args.find((a) => a.startsWith("--count="))?.split("=")[1] ?? 360);

/** Deterministik PRNG — aynı komut aynı katalogu üretsin (mulberry32). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260815);
const pick = <T,>(list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const ri = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const chance = (p: number) => rng() < p;

// ---------------------------------------------------------------------------
// Ürün havuzu — bir ilan = bir görsel seti
//
// Eskiden alt tür başına ortak bir havuz vardı ve her ilan oradan 3-5 rastgele
// fotoğraf alıyordu; sonuç, TEK BİR İLANIN İÇİNDE farklı arabaların görünmesiydi.
// Artık her ilan katalogdan bir "ürün" alıyor: fotoğrafların tamamı aynı modele
// ait ve vasıta/teknolojide ilanın markası/modeli/yılı da o üründen geliyor.
// ---------------------------------------------------------------------------
let itemPools: Record<string, PreparedItem[]> = {};
const itemCursor: Record<string, number> = {};

/** Alt tür için sıradaki ürün; havuz biterse başa döner (setler tutarlı kalır). */
function takeItem(subType: string): PreparedItem | null {
  const pool = itemPools[subType];
  if (!pool?.length) return null;
  const index = itemCursor[subType] ?? 0;
  itemCursor[subType] = index + 1;
  return pool[index % pool.length];
}

/**
 * Görseli olan alt türler.
 *
 * Boş dizi döndürebilir ve BU KASITLI: eskiden aday listesine geri düşüyordu,
 * sonuçta katalogda emlak görseli yokken 6 tane fotoğrafsız daire ilanı
 * üretiliyordu. Fotoğrafsız ilan vitrinden de elenir, listede de boş kart olur.
 * Çağıran taraf boş dizi görürse o kategoriyi tamamen atlar.
 */
function withImages(candidates: string[]): string[] {
  return candidates.filter((s) => itemPools[s]?.length);
}

/** Kategori -> alt tür ağırlıkları (tekrar eden değer = daha yüksek pay). */
const CATEGORY_SUBTYPES: Record<string, string[]> = {
  emlak: ["daire", "daire", "daire", "villa", "mustakil", "arsa", "tarla", "isyeri"],
  vasita: ["otomobil", "otomobil", "otomobil", "motosiklet", "ticari", "traktor"],
  teknoloji: ["telefon", "telefon", "bilgisayar", "bilgisayar", "tablet", "konsol", "kamera"],
};
const CATEGORY_WEIGHTS: Record<string, number> = { emlak: 0.5, vasita: 0.3, teknoloji: 0.2 };

// Yıl hesapları sabit yazılırsa katalogda hiç güncel model olmaz ve gelecek
// yıl fiyat/yaş hesabı sessizce kayar (kategori kaydı zaten dinamik).
const CURRENT_YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Kütahya coğrafyası
// ---------------------------------------------------------------------------
// Merkez ağırlıklı dağılım — gerçek bir portföyde ilanların çoğu merkezde olur.
const DISTRICT_WEIGHTS: [string, number][] = [
  ["Merkez", 42], ["Tavşanlı", 12], ["Simav", 10], ["Gediz", 8], ["Emet", 5],
  ["Domaniç", 4], ["Hisarcık", 4], ["Altıntaş", 4], ["Aslanapa", 3],
  ["Dumlupınar", 2], ["Çavdarhisar", 2], ["Pazarlar", 2], ["Şaphane", 2],
];
// İlçe merkezleri — emlak ilanlarına gerçekçi bir koordinat vermek için.
// prisma/seed.ts'teki District kayıtlarıyla aynı değerler.
const DISTRICT_COORDS: Record<string, [number, number]> = {
  Merkez: [39.4242, 29.9833], Tavşanlı: [39.5469, 29.4936], Simav: [39.0894, 28.9783],
  Gediz: [39.0411, 29.4144], Emet: [39.3447, 29.2603], Domaniç: [39.8003, 29.6042],
  Hisarcık: [39.2503, 29.2331], Altıntaş: [39.0686, 30.1108], Aslanapa: [39.2167, 29.8667],
  Dumlupınar: [39.0667, 29.95], Çavdarhisar: [39.2089, 29.6164], Pazarlar: [39.2667, 29.3667],
  Şaphane: [39.0322, 29.215],
};

/** İlçe merkezine ~2-3 km sapma. Konum "yaklaşık" gösterildiği için yeterli. */
function coordsFor(district: string): { lat: number; lng: number } {
  const [lat, lng] = DISTRICT_COORDS[district] ?? DISTRICT_COORDS.Merkez;
  return {
    lat: Number((lat + (rng() - 0.5) * 0.05).toFixed(6)),
    lng: Number((lng + (rng() - 0.5) * 0.05).toFixed(6)),
  };
}

// S10: "Tavşanlı'de" gibi hatalar yüzlerce ilanın son cümlesinde görünüyordu.
const BACK_VOWELS = "aıou";
const VOICELESS = "fstkçşhp";
/** Türkçe bulunma hâli eki: Merkez'de, Tavşanlı'da, Emet'te, Hisarcık'ta. */
function locative(name: string): string {
  const letters = [...name.toLocaleLowerCase("tr-TR")];
  const lastVowel = letters.reverse().find((c) => "aeıioöuü".includes(c)) ?? "a";
  const back = BACK_VOWELS.includes(lastVowel);
  const hard = VOICELESS.includes(name.slice(-1).toLocaleLowerCase("tr-TR"));
  return `${name}'${hard ? "t" : "d"}${back ? "a" : "e"}`;
}

function weightedDistrict(): string {
  const total = DISTRICT_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [name, w] of DISTRICT_WEIGHTS) {
    if ((r -= w) <= 0) return name;
  }
  return "Merkez";
}

const NEIGHBORHOODS: Record<string, string[]> = {
  Merkez: ["Cedit", "Alipaşa", "Bölcek", "Yıldırım Beyazıt", "Siner", "Evliya Çelebi", "Zafertepe", "İnköy", "Yoncalı", "Perli"],
  Tavşanlı: ["Yeni", "Moymul", "Ulucami", "Durak", "Kavaklı"],
  Simav: ["Cumhuriyet", "Fatih", "Kalkan", "Yeni"],
  Gediz: ["Yeni", "Cumhuriyet", "Eskigediz", "Karaağaç"],
};
const GENERIC_NEIGHBORHOODS = ["Cumhuriyet", "Fatih", "Yeni", "İstiklal", "Atatürk", "Hürriyet"];
const neighborhoodFor = (d: string) => pick(NEIGHBORHOODS[d] ?? GENERIC_NEIGHBORHOODS);

// ---------------------------------------------------------------------------
// Emlak
// ---------------------------------------------------------------------------
/** Alana uyan oda sayısı — sınırda iki seçenekten biri, hep aynı olmasın diye. */
function roomsForArea(area: number): string {
  if (area < 75) return pick(["1+0", "1+1", "2+1"]);
  if (area < 110) return pick(["2+1", "3+1"]);
  if (area < 165) return pick(["3+1", "4+1"]);
  if (area < 240) return pick(["4+1", "4+2"]);
  return pick(["4+2", "5+1"]);
}

const HEATING = ["Doğalgaz kombi", "Merkezi", "Yerden ısıtma", "Klima", "Soba"];
const ZONING = ["Konut", "Ticari", "Konut + Ticari", "İmara açık", "Tarla vasfında"];
const DEED = ["Kat mülkiyeti", "Kat irtifakı", "Arsa tapulu", "Müstakil tapu"];

// Olanaklar alt türe göre: bir iş yerinde "Ebeveyn banyosu", bir arsada
// "Asansör" seçili olamaz. Anahtarlar lib/listingAmenities.ts kaydından.
const AMENITY_POOL: Record<string, string[]> = {
  daire: [
    "built_in_kitchen", "ensuite_bathroom", "pantry", "air_conditioning", "thermal_insulation",
    "fiber_internet", "elevator", "closed_parking", "security", "playground",
    "public_transport", "school", "market", "city_center", "city_view",
  ],
  villa: [
    "built_in_kitchen", "ensuite_bathroom", "dressing_room", "fireplace", "underfloor_heating",
    "fiber_internet", "swimming_pool", "closed_parking", "security", "generator",
    "nature_view", "city_view", "school",
  ],
  mustakil: [
    "built_in_kitchen", "fireplace", "pantry", "air_conditioning", "thermal_insulation",
    "closed_parking", "nature_view", "school", "market",
  ],
  isyeri: [
    "air_conditioning", "fiber_internet", "sound_insulation", "elevator", "closed_parking",
    "security", "generator", "public_transport", "city_center", "accessible_entrance",
  ],
};

/** Havuzdan 4-9 olanak; her ilan aynı listeyi taşımasın diye sayı da değişiyor. */
function pickAmenities(subType: string): string[] {
  const pool = AMENITY_POOL[subType] ?? AMENITY_POOL.daire;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, ri(4, 9));
}

function realEstate() {
  const subType = pick(withImages(CATEGORY_SUBTYPES.emlak));
  const item = takeItem(subType);
  const district = weightedDistrict();
  const neighborhood = neighborhoodFor(district);
  const isLand = subType === "arsa" || subType === "tarla";
  const isCommercial = subType === "isyeri";
  const central = district === "Merkez";

  const area = isLand ? ri(500, 12000) : subType === "villa" ? ri(180, 420) : isCommercial ? ri(45, 400) : ri(65, 210);
  // Oda sayısı ALANA bağlı: bağımsız seçildiğinde "203 m² 1+1 daire" gibi
  // kendi içinde saçma ilanlar çıkıyordu.
  const rooms = isLand || isCommercial ? null : roomsForArea(area);
  // Fiyat: m² birim fiyatı × alan, merkez primi ve tür katsayısıyla.
  const unit = isLand ? ri(400, 2200) : isCommercial ? ri(14000, 32000) : ri(16000, 38000);
  const price = Math.round((area * unit * (central ? 1.25 : 1)) / 1000) * 1000;

  const label =
    subType === "daire" ? `${rooms} Daire`
    : subType === "villa" ? "Villa"
    : subType === "mustakil" ? "Müstakil Ev"
    : subType === "arsa" ? "Arsa"
    : subType === "tarla" ? "Tarla"
    : "İş Yeri";

  // Niteleme ALT TÜRE göre: "ara kat, güneşli" bir arsada ya da iş yerinde
  // anlamsız; sunumda ilk göze batan şey bu tür tutarsızlıklar oluyor.
  const FLAVOURS: Record<string, string[]> = {
    daire: ["Ara kat, güneşli", "Site içinde, otoparklı", "Sıfır bina, teslime hazır", "Geniş balkonlu", "Okula ve hastaneye yürüme mesafesi", "Bakımlı, hemen taşınmalık"],
    villa: ["Havuzlu, özel bahçeli", "Şehre yakın, doğayla iç içe", "Çift garajlı, müstakil girişli", "Manzaralı, geniş teraslı"],
    mustakil: ["Bahçeli, müstakil girişli", "Köy yerinde, bakımlı", "Geniş avlulu", "Tadilatlı, kullanıma hazır"],
    arsa: ["İmarlı, yola cepheli", "Köşe parsel, çift cepheli", "Yatırıma uygun, hisseli değil", "Elektrik ve su hattı mevcut"],
    tarla: ["Sulanabilir, yola cepheli", "Traktör girişine uygun", "Verimli toprak, tek parça", "Yatırımlık, imara yakın"],
    isyeri: ["Cadde üzeri, yüksek kira getirili", "Kiracılı, hazır getirili", "Vitrinli, geniş cepheli", "Depolu, yükleme rampalı"],
  };
  const flavour = pick(FLAVOURS[subType] ?? FLAVOURS.daire);

  return {
    subType,
    images: item?.urls ?? [],
    district,
    neighborhood,
    ...coordsFor(district),
    // Olanaklar (ListingAmenity) yalnız yapılı taşınmazda anlamlı: bir tarlada
    // "Ankastre mutfak" seçili olamaz.
    amenities: isLand ? [] : pickAmenities(subType),
    title: `${district} ${neighborhood} Mahallesi'nde ${label} | ${area} m² — ${flavour}`.slice(0, 140),
    price: Math.max(price, 150_000),
    areaGross: area,
    areaNet: isLand ? null : Math.round(area * 0.86),
    rooms,
    floor: isLand || isCommercial ? null : String(ri(1, 8)),
    totalFloors: isLand ? null : ri(3, 12),
    buildingAge: isLand ? null : String(ri(0, 25)),
    heating: isLand ? null : pick(HEATING),
    zoningStatus: isLand ? pick(ZONING) : null,
    deedStatus: pick(DEED),
    description:
      `Kütahya ${locative(district)}, ${neighborhood} Mahallesi'nde ${label.toLowerCase()}. ${flavour}. ` +
      `Toplam ${area} m² kullanım alanı. Ulaşım, market ve okullara yakın konumda. ` +
      `Detaylı bilgi ve yerinde inceleme için iletişime geçebilirsiniz.`,
    attributes: null,
  };
}

// ---------------------------------------------------------------------------
// Vasıta
// ---------------------------------------------------------------------------
const CARS: [string, string[]][] = [
  ["Renault", ["Clio 1.5 dCi Touch", "Megane 1.3 TCe Icon", "Symbol 1.0 Joy", "Captur 1.3 Icon"]],
  ["Fiat", ["Egea 1.6 Multijet Lounge", "Egea 1.4 Fire Easy", "Doblo 1.6 Combi", "Fiorino 1.3 Pop"]],
  ["Volkswagen", ["Polo 1.0 TSI Comfortline", "Golf 1.6 TDI Highline", "Passat 1.6 TDI Impression"]],
  ["Ford", ["Focus 1.5 TDCi Trend X", "Fiesta 1.4 Titanium", "Courier 1.5 TDCi Trend"]],
  ["Toyota", ["Corolla 1.6 Dream", "Yaris 1.5 Flame", "C-HR 1.8 Hybrid"]],
  ["Hyundai", ["i20 1.4 MPI Style", "Accent Blue 1.6 CRDi Mode Plus", "Tucson 1.6 CRDi Elite"]],
  ["Opel", ["Astra 1.6 CDTI Enjoy", "Corsa 1.4 Essentia", "Insignia 1.6 CDTI Excellence"]],
  ["Dacia", ["Duster 1.5 dCi Comfort", "Sandero 1.0 Stepway", "Logan 1.5 dCi Laureate"]],
];
const BIKES: [string, string[]][] = [
  ["Honda", ["PCX 125", "CB 125 F", "Forza 250"]],
  ["Yamaha", ["NMAX 125", "MT-07", "Crypton 110"]],
  ["Kuba", ["CR5 125", "Mirage 150"]],
  ["Bajaj", ["Boxer 150", "Pulsar NS200"]],
];
const VANS: [string, string[]][] = [
  ["Ford", ["Transit 350L", "Custom 320S", "Connect 220S"]],
  ["Volkswagen", ["Transporter 2.0 TDI City Van", "Caddy 2.0 TDI Maxi"]],
  ["Fiat", ["Ducato 15 M-Jet", "Doblo Cargo 1.6"]],
  ["Mercedes-Benz", ["Vito 111 CDI", "Sprinter 315 CDI"]],
];
const TRACTORS: [string, string[]][] = [
  ["New Holland", ["TD 75D Çift Çeker", "TT 55 Bahçe", "T4.75"]],
  ["Massey Ferguson", ["MF 265 S", "MF 3060", "MF 5709"]],
  ["John Deere", ["5075E", "6110B"]],
  ["Türk Traktör", ["Fiat 480", "TT 4110", "Fiat 54C"]],
  ["Tümosan", ["8075", "8095", "9110"]],
];
const COLORS = ["Beyaz", "Siyah", "Gri", "Gümüş", "Kırmızı", "Lacivert", "Mavi"];

function vehicle() {
  const subType = pick(withImages(CATEGORY_SUBTYPES.vasita));
  const item = takeItem(subType);
  const table = subType === "otomobil" ? CARS : subType === "motosiklet" ? BIKES : subType === "ticari" ? VANS : TRACTORS;
  const [fallbackMarka, fallbackModels] = pick(table);
  // Ürün varsa başlık FOTOĞRAFTAKİ araca göre yazılır; yoksa tabloya düşülür.
  const marka = item?.marka ?? fallbackMarka;
  const model = item?.model ?? pick(fallbackModels);
  const yil = item?.yil ?? (subType === "traktor" ? ri(CURRENT_YEAR - 30, CURRENT_YEAR) : ri(CURRENT_YEAR - 18, CURRENT_YEAR));
  const age = Math.max(0, CURRENT_YEAR - yil);
  const kilometre = subType === "motosiklet" ? ri(500, 60_000) : subType === "traktor" ? ri(800, 12_000) : ri(15_000, 320_000);

  const base =
    subType === "otomobil" ? 1_450_000
    : subType === "motosiklet" ? 190_000
    : subType === "ticari" ? 1_100_000
    : 950_000;
  // Yaş ve kilometreyle değer kaybı; taban fiyatın altına düşmesin.
  const price = Math.max(
    Math.round((base * Math.pow(0.92, age) * (1 - Math.min(kilometre / 600_000, 0.35))) / 5000) * 5000,
    subType === "motosiklet" ? 35_000 : 180_000,
  );

  const yakit = subType === "motosiklet" ? "benzin" : subType === "traktor" ? "dizel" : pick(["benzin", "dizel", "dizel", "lpg", "hibrit"]);
  const vites = subType === "traktor" || subType === "motosiklet" ? "manuel" : pick(["manuel", "manuel", "otomatik"]);
  const hasar = pick(["hasarsiz", "hasarsiz", "boyali", "degisen", "hasar_kayitli"]);
  const renk = item?.renk ?? pick(COLORS);
  const district = weightedDistrict();

  // Başlık ile nitelik ÇELİŞMEMELİ: hasar kaydı olan bir araca "Değişensiz,
  // hatasız" demek vasıtada en kritik alanda yalan söylemek olur. Havuz hasar
  // değerine göre daraltılıyor.
  const NEUTRAL_FLAVOURS = [
    "Zamanı gelen bakımları yapıldı",
    "Takas olur, kredi kullanılabilir",
    "Muayenesi yeni yapıldı",
    "Tek elden, bakımları yetkili serviste",
  ];
  const flavour =
    hasar === "hasarsiz"
      ? pick([...NEUTRAL_FLAVOURS, "Değişensiz, hatasız", "Garaj arabası, az kullanılmış"])
      : hasar === "boyali"
        ? pick([...NEUTRAL_FLAVOURS, "Lokal boyalı, kaza kaydı yok"])
        : hasar === "degisen"
          ? pick([...NEUTRAL_FLAVOURS, "Değişen parçalar ilanda belirtilmiştir"])
          : pick([...NEUTRAL_FLAVOURS, "Hasar kaydı vardır, fiyatına yansıtılmıştır"]);

  return {
    subType,
    images: item?.urls ?? [],
    district,
    // Taşınabilir bir üründe mahalle bilgisi hem gereksiz hem yanıltıcı
    // ("Mahalle: Cedit" + aynı ilanda "kargo yapılabilir").
    neighborhood: null,
    title: `${yil} ${marka} ${model} — ${flavour}`.slice(0, 140),
    price,
    description:
      `${yil} model ${marka} ${model}. ${kilometre.toLocaleString("tr-TR")} km'de, ${renk.toLowerCase()} renk. ` +
      `${flavour}. Görüşmeye açık, ilanda yazan fiyat üzerinden pazarlık payı vardır. ` +
      `Aracı Kütahya ${locative(district)} yerinde görebilirsiniz.`,
    attributes: { marka, model, yil, kilometre, yakit, vites, renk, hasar },
  };
}

// ---------------------------------------------------------------------------
// Teknoloji
// ---------------------------------------------------------------------------
// Taban fiyat MARKA değil MODEL başına: marka başına tek taban, sıfır bir
// iPhone 12 ile sıfır bir iPhone 14 Pro'yu aynı fiyata koyuyordu — katalogda
// fiyat sıralaması tersine dönüyordu.
type TechTable = [marka: string, models: [ad: string, taban: number][]][];

const PHONES: TechTable = [
  ["Apple", [["iPhone 12 64 GB", 21_000], ["iPhone 13 128 GB", 29_000], ["iPhone 15 128 GB", 47_000], ["iPhone 14 Pro 256 GB", 58_000]]],
  ["Samsung", [["Galaxy A54 128 GB", 16_000], ["Galaxy S23 256 GB", 34_000], ["Galaxy S22 Ultra 256 GB", 38_000]]],
  ["Xiaomi", [["Poco X6 256 GB", 12_000], ["Redmi Note 13 Pro 256 GB", 15_000], ["13T 256 GB", 22_000]]],
];
const COMPUTERS: TechTable = [
  ["Apple", [["MacBook Air M2 8/256", 44_000], ["MacBook Pro 14 M3 16/512", 78_000]]],
  ["Lenovo", [["IdeaPad Gaming 3 RTX 3050", 24_000], ["ThinkPad E14 Gen 5", 31_000]]],
  ["Asus", [["Vivobook 15 i5", 22_000], ["TUF Gaming F15 RTX 4060", 42_000]]],
  ["HP", [["Pavilion 14 i5", 21_000], ["Victus 15 RTX 3050", 27_000]]],
];
const TABLETS: TechTable = [
  ["Apple", [["iPad 10. Nesil 64 GB", 19_000], ["iPad Air M1 64 GB", 27_000]]],
  ["Samsung", [["Galaxy Tab A9+ 64 GB", 9_500], ["Galaxy Tab S9 FE 128 GB", 18_000]]],
  ["Xiaomi", [["Redmi Pad SE 128 GB", 8_000]]],
];
const CONSOLES: TechTable = [
  ["Sony", [["PlayStation 4 Pro 1 TB", 12_000], ["PlayStation 5 Slim 1 TB", 28_000]]],
  ["Microsoft", [["Xbox Series S 512 GB", 14_000], ["Xbox Series X 1 TB", 26_000]]],
  ["Nintendo", [["Switch Lite", 9_000], ["Switch OLED", 16_000]]],
];
const CAMERAS: TechTable = [
  ["Canon", [["EOS 250D + 18-55 mm", 24_000], ["EOS R10 + 18-45 mm", 38_000]]],
  ["Nikon", [["D5600 + 18-140 mm", 26_000], ["Z50 + 16-50 mm", 34_000]]],
  ["Sony", [["ZV-E10 Body", 29_000], ["Alpha A6400 + 16-50 mm", 40_000]]],
];

// Katalogdan gelen bir model için taban fiyat: alt tür tabanı × marka katsayısı.
// Elle yazılmış model tablosu yalnız kataloğun kapsamadığı durumlarda devrede;
// katalogdaki her modele fiyat yazmak sürdürülemez, marka kademesi yeterince
// tutarlı bir sıralama veriyor.
const TECH_SUBTYPE_BASE: Record<string, number> = {
  telefon: 26_000, bilgisayar: 34_000, tablet: 17_000, konsol: 20_000, kamera: 30_000,
};
const TECH_BRAND_TIER: Record<string, number> = {
  Apple: 1.55, Sony: 1.1, Samsung: 1.1, Fujifilm: 1.05, MSI: 1.05, Dell: 1.0,
  Canon: 1.0, Nikon: 1.0, Microsoft: 0.95, Asus: 0.95, Lenovo: 0.9, HP: 0.85,
  Acer: 0.8, Nintendo: 0.75, Huawei: 0.75, Oppo: 0.65, Xiaomi: 0.6, Poco: 0.55, Realme: 0.55,
};

function techBase(subType: string, marka: string, model: string): number {
  const base = TECH_SUBTYPE_BASE[subType] ?? 20_000;
  const tier = TECH_BRAND_TIER[marka] ?? 0.9;
  // Üst segment adlandırmaları fiyatı belirgin biçimde yukarı çeker.
  const premium = /\b(pro|ultra|max|plus)\b/i.test(model) ? 1.28 : 1;
  return Math.round(base * tier * premium);
}

function tech() {
  const subType = pick(withImages(CATEGORY_SUBTYPES.teknoloji));
  const item = takeItem(subType);
  const table =
    subType === "telefon" ? PHONES
    : subType === "bilgisayar" ? COMPUTERS
    : subType === "tablet" ? TABLETS
    : subType === "konsol" ? CONSOLES
    : CAMERAS;
  const [fallbackMarka, fallbackModels] = pick(table);
  const [fallbackModel, fallbackBase] = pick(fallbackModels);
  const marka = item?.marka ?? fallbackMarka;
  const model = item?.model ?? fallbackModel;
  const base = item?.marka ? techBase(subType, marka, model) : fallbackBase;
  const durum = item?.durum ?? (chance(0.28) ? "sifir" : "ikinci_el");
  const garanti = durum === "sifir" ? "var" : chance(0.45) ? "var" : "yok";
  // Sıfırda bile ufak bir sapma: aynı modelin her ilanı kuruşu kuruşuna aynı
  // fiyattaysa liste üretilmiş gibi görünüyor.
  const price = Math.max(
    Math.round((base * (durum === "sifir" ? ri(97, 103) / 100 : ri(58, 88) / 100)) / 500) * 500,
    3_000,
  );
  const district = weightedDistrict();

  // "Ekran değişimi yok" bir oyun konsolunda ya da kamerada anlamsız.
  const USED_FLAVOURS: Record<string, string[]> = {
    telefon: ["Ekran değişimi yok, orijinal", "Çizik yok, bakımlı", "Batarya sağlığı yüksek", "Faturası ve kutusu mevcut"],
    bilgisayar: ["Şarj döngüsü düşük", "Tuş ve ekran kusursuz", "Yükseltilmiş RAM/SSD", "Faturası mevcut"],
    tablet: ["Ekranı çiziksiz", "Az kullanılmış, temiz", "Kalemi dahil", "Kılıfıyla birlikte"],
    konsol: ["İki kolu birlikte", "Az oynanmış, temiz", "Orijinal kutusunda", "Ek oyunlarla birlikte"],
    kamera: ["Deklanşör sayısı düşük", "Lensinde çizik yok", "Çantası ve yedek bataryası dahil", "Servis görmemiş"],
  };
  const flavour =
    durum === "sifir"
      ? pick(["Kutusu açılmamış, faturalı", "Sıfır ürün, Türkiye garantili"])
      : pick(USED_FLAVOURS[subType] ?? USED_FLAVOURS.telefon);

  // `kutu` bağımsız zar atışıyken başlık "Kutusu açılmamış" derken nitelik
  // "Kutusu yok" diyebiliyordu — ilan kendi içinde çelişiyordu. Artık türetiliyor.
  const claimsBox = durum === "sifir" || /kutu/i.test(flavour);
  const kutu = claimsBox ? "tam" : chance(0.45) ? "tam" : "eksik";

  return {
    subType,
    images: item?.urls ?? [],
    district,
    // Teknoloji ürünü taşınabilir: mahalle bilgisi yanıltıcı.
    neighborhood: null,
    title: `${marka} ${model} — ${flavour}`.slice(0, 140),
    price,
    description:
      `${marka} ${model}. ${durum === "sifir" ? "Sıfır ürün" : "İkinci el"}, ${flavour.toLowerCase()}. ` +
      `${garanti === "var" ? "Garantisi devam ediyor." : "Garanti süresi dolmuştur."} ` +
      `${kutu === "tam" ? "Kutusu ve aksesuarları tam." : "Kutusu yok, temel aksesuarlar mevcut."} ` +
      `Kütahya ${locative(district)} elden teslim, kargo da yapılabilir.`,
    attributes: { marka, model, durum, garanti, kutu },
  };
}

// ---------------------------------------------------------------------------
// Sahiplik — ilanlar sahipsiz kalmamalı
//
// Sahipsiz ilan yalnız veri eksikliği değil, YANLIŞ ARAYÜZ demek: ilan detayı
// "ne danışman ne bireysel sahip" dalına düşüyor ve emlak akışını (ekspertiz,
// yerinde randevu, fiyat teklifi) bir traktör ilanında gösteriyor.
//
// Dağılım ürünün kendi kuralını izliyor (kilitli karar):
//   emlak                -> onaylı emlakçı (ofise bağlı)
//   vasita, teknoloji    -> bireysel kullanıcı
// ---------------------------------------------------------------------------

const AGENCIES = [
  { name: "Evliya Gayrimenkul", districts: ["Merkez", "Yoncalı"] },
  { name: "Çini Emlak", districts: ["Merkez", "Bölcek"] },
  { name: "Dumlupınar Yapı & Emlak", districts: ["Merkez", "Dumlupınar"] },
  { name: "Tavşanlı Portföy", districts: ["Tavşanlı", "Emet"] },
  { name: "Simav Konut", districts: ["Simav", "Şaphane"] },
  { name: "Gediz Emlak Ofisi", districts: ["Gediz", "Pazarlar"] },
];

const AGENT_NAMES = [
  "Hüseyin Yılmaz", "Ayşe Demir", "Mehmet Kaya", "Fatma Şahin",
  "Ahmet Çelik", "Zeynep Aydın", "Mustafa Doğan", "Elif Arslan",
  "Kemal Öztürk", "Hatice Yıldız", "Emre Koç", "Merve Aslan",
];

const SELLER_NAMES = [
  "Ali Kurt", "Selin Ateş", "Burak Tunç", "Deniz Ergin", "Cem Bozkurt",
  "Ece Yalçın", "Serkan Uysal", "Nazlı Kılıç", "Onur Şen", "Pınar Aksoy",
  "Volkan Tekin", "Gizem Barut", "Tolga Erdem", "Sude Polat", "Kaan Işık",
  "Melis Duran", "Baran Sarı", "İrem Çetin", "Umut Güneş", "Ceren Akın",
  "Hakan Bulut", "Yasemin Kara", "Eren Toprak", "Damla Öz", "Sinan Ak",
  "Buse Yavuz", "Furkan Ünal", "Aslı Turan", "Berk Sezer", "Nehir Balcı",
];

/** 05XX XXX XX XX — gerçek bir numaraya denk gelmesin diye 0555 555 bloğu. */
const demoPhone = (i: number) => `0555 555 ${String(10 + (i % 90)).padStart(2, "0")} ${String(i % 100).padStart(2, "0")}`;

async function ensureOwners() {
  // Tek hash, hepsinde aynı: demo hesapların parolası gizli bir bilgi değil ama
  // düz metin de tutulmuyor. Giriş yapılması beklenmiyor.
  const passwordHash = await bcrypt.hash(randomUUID(), 10);

  const agencies = [];
  for (const [index, def] of AGENCIES.entries()) {
    const slug = slugify(def.name);
    agencies.push(
      await prisma.agency.upsert({
        where: { slug },
        update: {},
        create: {
          name: def.name,
          slug,
          description: `${def.districts[0]} ve çevresinde ${ri(8, 24)} yıldır hizmet veren yerel emlak ofisi.`,
          address: `${def.districts[0]}, Kütahya`,
          serviceDistricts: JSON.stringify(def.districts),
          status: "approved",
          published: true,
          approvedAt: new Date(),
          verifiedAt: index < 3 ? new Date() : null,
          showPhone: true,
        },
        select: { id: true, name: true },
      }),
    );
  }

  const agents = [];
  for (const [index, name] of AGENT_NAMES.entries()) {
    const agency = agencies[index % agencies.length];
    const slug = slugify(name);
    agents.push(
      await prisma.agent.upsert({
        where: { slug },
        update: {},
        create: {
          email: `${slug}@demo.kutahyasatilik.com`,
          passwordHash,
          name,
          phone: demoPhone(index),
          title: "Gayrimenkul Danışmanı",
          agency: agency.name,
          agencyId: agency.id,
          slug,
          status: "approved",
          approvedAt: new Date(),
          publicProfile: true,
          showPhone: true,
          showWhatsapp: true,
          experienceYears: ri(2, 18),
          bio: `Kütahya'da konut ve arsa portföyünde ${ri(2, 18)} yıllık deneyim.`,
        },
        select: { id: true, agencyId: true },
      }),
    );
  }

  const sellers = [];
  for (const [index, name] of SELLER_NAMES.entries()) {
    const email = `${slugify(name)}@demo.kutahyasatilik.com`;
    sellers.push(
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, passwordHash, name, phone: demoPhone(index + 40), verifiedAt: new Date() },
        select: { id: true },
      }),
    );
  }

  console.log(`Sahipler: ${agencies.length} ofis · ${agents.length} danışman · ${sellers.length} bireysel satıcı`);
  return { agents, sellers };
}

// ---------------------------------------------------------------------------
// Katalog dışı içerik — "tutarlı veri" yalnız ilan demek değil
//
// /blog, ana sayfadaki referans şeridi, hesabım > mesajlar ve favoriler
// tamamen boştu. Bir sunumda boş bir sayfa "yapılmamış" diye okunur; bu bölüm
// o yüzeyleri katalogla TUTARLI biçimde dolduruyor (mesajlar gerçek ilanlara,
// referanslar gerçek ilçelere bağlı).
// ---------------------------------------------------------------------------

const TESTIMONIALS = [
  { name: "Serkan A.", role: "Daire sahibi · Merkez", text: "İlanı akşam verdim, ertesi gün üç ayrı alıcı aradı. Fotoğrafları ve ilan metnini birlikte düzenlediğimiz için gelen sorular da ciddiydi." },
  { name: "Nurten K.", role: "Alıcı · Tavşanlı", text: "Aradığım kriterleri kaydettim, uygun ilan girildiğinde bildirim geldi. İlanı ilk gören ben oldum, hafta içinde anlaştık." },
  { name: "Emrah T.", role: "Araç satıcısı · Simav", text: "Aracı ilçeden satmak zordur, buradan iki haftada sattım. Alıcıyla mesajlaşıp fiyatta anlaştıktan sonra buluştuk." },
  { name: "Hatice Y.", role: "Arsa yatırımcısı · Altıntaş", text: "Bölge analizi sayfasındaki m² fiyatları karar verirken çok işime yaradı. Aynı parseli iki ay önce görseydim daha ucuza alırdım." },
  { name: "Onur B.", role: "Emlak danışmanı · Merkez", text: "Portföyümü tek yerden yönetiyorum, gelen talepler doğrudan panele düşüyor. Telefonla not tutmaktan kurtuldum." },
];

const POSTS = [
  {
    title: "Kütahya'da satılık daire alırken kontrol edilmesi gereken 8 şey",
    excerpt: "Tapu kaydından iskân belgesine, aidat geçmişinden bina yaşına: sözleşmeden önce sorulması gereken sorular.",
    tags: "emlak,rehber,daire",
    content: `<p>Kütahya'da konut alım sürecinde en sık atlanan konu, ilan üzerinde görünmeyen belgelerdir. Aşağıdaki başlıklar, sözleşme masasına oturmadan önce netleştirilmelidir.</p>
<h2>1. Tapu kaydı ve tapu türü</h2><p>Kat mülkiyeti mi kat irtifakı mı? Kat irtifakı olan bir binada iskân alınmamış olabilir; bu, krediye uygunluğu doğrudan etkiler.</p>
<h2>2. İskân (yapı kullanma izin belgesi)</h2><p>İskânı olmayan bir dairede aboneliklerin ticari tarifeden açılması gerekebilir.</p>
<h2>3. Bina yaşı ve deprem yönetmeliği</h2><p>2000 öncesi yapılarda taşıyıcı sistem raporu istemek makul bir taleptir.</p>
<h2>4. Aidat ve site yönetimi</h2><p>Aidatın neyi kapsadığı (ısınma, güvenlik, havuz) bütçeyi ciddi biçimde değiştirir.</p>
<h2>5. Isıtma sistemi</h2><p>Doğalgaz kombi, merkezi sistem ve pay ölçer arasındaki fark yıllık gider olarak yüzde onlarla ifade edilir.</p>
<h2>6. Ortak alan ve otopark</h2><p>Otoparkın tapuda eklenti olup olmadığı sonradan sorun çıkaran konuların başında gelir.</p>
<h2>7. Kiracı durumu</h2><p>Kiracılı satın alınan konutta tahliye süreci mevzuata bağlıdır; teslim tarihi sözleşmede yazmalıdır.</p>
<h2>8. Ekspertiz</h2><p>Kredi kullanılmasa bile bağımsız ekspertiz, pazarlık masasında en güçlü belgedir.</p>`,
  },
  {
    title: "Kütahya ilçelerinde arsa yatırımı: nereye, neden bakılır?",
    excerpt: "Merkez, Altıntaş ve Tavşanlı hattında imar durumu, ulaşım yatırımları ve m² fiyatlarının seyri.",
    tags: "emlak,arsa,yatırım",
    content: `<p>Arsa yatırımında getiriyi belirleyen şey konumdan çok <strong>imar durumu</strong> ve <strong>zamanlama</strong>dır.</p>
<h2>İmar durumunu resmî kaynaktan doğrulayın</h2><p>İlanda yazan "imarlı" ifadesi tek başına yeterli değildir; belediyeden imar çapı alınmalıdır.</p>
<h2>Hisseli tapudan kaçının</h2><p>Hisseli tapu ucuz görünür, ancak satış ve kredi süreçlerinde diğer hissedarların onayı gerekir.</p>
<h2>Yol cephesi ve altyapı</h2><p>Elektrik, su ve yol cephesi olmayan bir parselin bugünkü fiyatı, altyapı geldiğinde hızla değişir.</p>
<h2>Bölge analizini kullanın</h2><p>Sitedeki bölge analizi sayfası ilçe bazında m² fiyatlarını ve üç yıllık değer artışını gösterir; karşılaştırma yaparken başlangıç noktası olarak kullanılabilir.</p>`,
  },
  {
    title: "İkinci el araç alırken ilanın hangi satırına bakmalı?",
    excerpt: "Hasar kaydı, kilometre tutarlılığı ve muayene tarihi: ilanda yazanla gerçeği ayıran detaylar.",
    tags: "vasıta,rehber",
    content: `<p>İkinci el araçta pazarlığın tamamı üç veriye dayanır: <strong>hasar kaydı</strong>, <strong>kilometre</strong> ve <strong>bakım geçmişi</strong>.</p>
<h2>Hasar kaydı</h2><p>"Değişensiz" ifadesi ile "boyasız" aynı şey değildir. Ekspertiz raporu olmadan ikisi de doğrulanamaz.</p>
<h2>Kilometre tutarlılığı</h2><p>Yıllık ortalama 15.000-20.000 km'dir. Çok düşük kilometre her zaman avantaj değildir; uzun süre kullanılmayan araçlarda ayrı sorunlar çıkar.</p>
<h2>Muayene ve sigorta</h2><p>Muayene tarihi ve kasko hasar kaydı, satıcının anlattığı hikâyeyi doğrulamanın en hızlı yoludur.</p>
<h2>Buluşma yeri</h2><p>Görüşmeyi gündüz ve kalabalık bir yerde yapın; kaparo öncesi ekspertize götürmeyi teklif edin.</p>`,
  },
  {
    title: "İkinci el telefon ve bilgisayar satarken ilanı nasıl yazmalı?",
    excerpt: "Kutu, fatura, garanti ve batarya sağlığı: alıcının ilk sorduğu dört soruyu ilana yazın.",
    tags: "teknoloji,rehber",
    content: `<p>Teknoloji ilanlarında satış hızını belirleyen şey fiyat değil, <strong>belirsizliğin azaltılması</strong>dır.</p>
<h2>Dört soruyu baştan yanıtlayın</h2><p>Kutusu var mı, faturası var mı, garantisi devam ediyor mu, cihaz servis gördü mü? Bu dördü ilan metninde yoksa alıcı mesaj atmak yerine bir sonraki ilana geçiyor.</p>
<h2>Fotoğrafı ürünün kendisinden çekin</h2><p>İnternetten alınmış ürün görseli güven kaybının en hızlı yoludur. Açık ekranda, gerçek ortamda çekilmiş üç fotoğraf yeterlidir.</p>
<h2>Fiyatı gerekçelendirin</h2><p>"Pazarlık payı vardır" yerine cihazın yaşını, kullanım durumunu ve varsa kusurunu yazın.</p>`,
  },
  {
    title: "İlanınız neden görüntülenmiyor? Sık yapılan 5 hata",
    excerpt: "Başlık, fotoğraf sırası, fiyat aralığı ve kategori seçimi ilanınızın görünürlüğünü doğrudan belirliyor.",
    tags: "rehber,ilan",
    content: `<p>Aynı mahallede, aynı fiyata iki ilan farklı sayıda görüntülenir. Fark genellikle şu beş başlıkta toplanır.</p>
<h2>1. Kapak fotoğrafı</h2><p>Listeleme ekranında görülen tek görsel kapaktır. Karanlık ya da dağınık bir kapak, ilanın tıklanma oranını yarıya indirir.</p>
<h2>2. Başlık</h2><p>Başlık ilanın kendisini anlatmalı: tür, alan ve ayırt edici bir özellik. Büyük harf ve ünlem işaretleri güven vermiyor.</p>
<h2>3. Yanlış kategori veya alt tür</h2><p>Yanlış alt türe konan bir ilan, filtreleyerek arayan kullanıcıya hiç görünmez.</p>
<h2>4. Piyasa dışı fiyat</h2><p>Fiyat aralığı filtresi dışında kalan ilan listede hiç çıkmaz. Bölge ortalamasını bölge analizi sayfasından kontrol edin.</p>
<h2>5. Eksik alanlar</h2><p>Oda sayısı, alan, yıl, kilometre gibi alanlar hem filtreleri hem de arama sonuçlarını besliyor.</p>`,
  },
];

async function ensureContent() {
  for (const [index, testimonial] of TESTIMONIALS.entries()) {
    const existing = await prisma.testimonial.findFirst({ where: { name: testimonial.name } });
    if (existing) continue;
    await prisma.testimonial.create({ data: { ...testimonial, stars: 5, published: true, sortOrder: index } });
  }

  for (const [index, post] of POSTS.entries()) {
    const slug = slugify(post.title);
    await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        ...post,
        slug,
        author: "Kütahya Satılık",
        status: "published",
        metaDescription: post.excerpt,
        viewCount: ri(120, 2400),
        publishedAt: new Date(Date.now() - (index + 1) * ri(4, 12) * 86_400_000),
      },
    });
  }
  console.log(`İçerik: ${TESTIMONIALS.length} referans · ${POSTS.length} blog yazısı`);
}

// ---------------------------------------------------------------------------
function slugify(input: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
  return input
    .toLowerCase()
    .replace(/[çğıöşüİ]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function main() {
  console.log(`Demo katalog — hedef ${TOTAL} ilan${RESET ? " (RESET: mevcut ilanlar silinecek)" : ""}`);

  // GÖRSELLER SİLMEDEN ÖNCE.
  //
  // İndirme dış ağa bağlı ve hatalar bilinçli olarak yutuluyor (ağsız ortamda
  // da çalışsın diye). Silme önce gelirse ve indirme o sırada tökezlerse ortaya
  // 360 GÖRSELSİZ ilan çıkıyor; vitrin sorgusu görselsiz ilanı elediği için de
  // hem web ana sayfası hem mobil ana ekran bomboş kalıyor. Bu sırayla, ağ
  // sorunu en kötü ihtimalle mevcut katalogu yerinde bırakır.
  const catalog = await loadCatalog();
  const catalogKeys = Object.keys(catalog).length;
  if (!catalogKeys) {
    throw new Error("prisma/demo-images.json bulunamadı veya boş; görsel kataloğu olmadan seed çalıştırılmıyor.");
  }
  console.log(`Görseller hazırlanıyor — ${catalogKeys} alt tür (inen nokta, atlanan x):`);
  itemPools = await prepareCatalogImages(catalog, { skipDownload: NO_IMAGES });
  const usable = Object.entries(itemPools).filter(([, v]) => v.length);
  console.log(
    `\n  ${usable.length}/${catalogKeys} alt tür hazır · ` +
      `${usable.reduce((n, [, v]) => n + v.length, 0)} ürün · ` +
      `${usable.reduce((n, [, v]) => n + v.reduce((m, i) => m + i.urls.length, 0), 0)} fotoğraf`,
  );
  for (const [key, list] of Object.entries(itemPools)) {
    if (!list.length) console.log(`  UYARI: ${key} için kullanılabilir görsel yok, bu alt türde ilan üretilmeyecek`);
  }
  if (RESET && !usable.length) {
    throw new Error("Hiçbir alt tür için görsel hazırlanamadı; --reset ile devam edilmiyor (katalog görselsiz kalırdı).");
  }

  if (RESET) {
    // Listing silinince ListingImage/Amenity/PriceHistory/Favorite/Conversation
    // cascade ile gider; Lead ve AnalyticsEvent SET NULL ile korunur.
    const { count } = await prisma.listing.deleteMany({});
    console.log(`  ${count} mevcut ilan silindi`);
  }

  const owners = await ensureOwners();

  // Dağılım hedefi emlak %50 / vasıta %30 / teknoloji %20, ancak yalnız GÖRSELİ
  // OLAN kategoriler pay alır ve ağırlıklar aralarında yeniden normalize edilir.
  // Katalog eksik geldiğinde 360 ilanın bir kısmının fotoğrafsız kalması yerine
  // hepsi mevcut kategorilere dağılıyor.
  const liveCategories = Object.keys(CATEGORY_SUBTYPES).filter(
    (c) => withImages(CATEGORY_SUBTYPES[c]).length > 0,
  );
  if (!liveCategories.length) throw new Error("Hiçbir kategoride kullanılabilir görsel yok.");
  const weightSum = liveCategories.reduce((n, c) => n + CATEGORY_WEIGHTS[c], 0);
  const counts: Record<string, number> = {};
  let assigned = 0;
  liveCategories.forEach((c, i) => {
    counts[c] = i === liveCategories.length - 1
      ? TOTAL - assigned
      : Math.round((TOTAL * CATEGORY_WEIGHTS[c]) / weightSum);
    assigned += counts[c];
  });
  const skipped = Object.keys(CATEGORY_SUBTYPES).filter((c) => !liveCategories.includes(c));
  if (skipped.length) console.log(`  Görseli olmadığı için atlanan kategori: ${skipped.join(", ")}`);

  const rows: {
    category: string; subType: string; images: string[];
    district: string; neighborhood: string | null;
    title: string; price: number; description: string;
    attributes: Record<string, string | number> | null;
    lat?: number; lng?: number; amenities?: string[];
    areaGross?: number | null; areaNet?: number | null; rooms?: string | null;
    floor?: string | null; totalFloors?: number | null; buildingAge?: string | null;
    heating?: string | null; zoningStatus?: string | null; deedStatus?: string | null;
  }[] = [];

  const GENERATORS: Record<string, () => Omit<(typeof rows)[number], "category">> = {
    emlak: realEstate,
    vasita: vehicle,
    teknoloji: tech,
  };
  for (const category of liveCategories) {
    for (let i = 0; i < counts[category]; i++) rows.push({ category, ...GENERATORS[category]() });
  }

  let created = 0;
  const usedSlugs = new Set<string>();
  const usedTitles = new Set<string>();
  for (const [index, row] of rows.entries()) {
    // Aynı ürün birden çok ilana düşebilir (havuz ilan sayısından küçükse).
    // Başlık birebir tekrar ederse liste kopyala-yapıştır gibi görünüyor;
    // ilçe eki hem ayırt ediyor hem doğru bilgi.
    if (usedTitles.has(row.title)) row.title = `${row.title} · ${row.district}`.slice(0, 140);
    usedTitles.add(row.title);

    let slug = slugify(row.title);
    if (!slug || usedSlugs.has(slug)) slug = `${slug || "ilan"}-${index}`;
    usedSlugs.add(slug);

    // Görseller ürünle birlikte geldi: ilanın tüm fotoğrafları aynı modele ait.
    const images = row.images;

    // Vitrin oranı ~%12 — hepsi vitrinse vitrin anlamını yitirir.
    const featured = chance(0.12);

    // Sahip ataması. Emlak ilanı danışmana, diğerleri bireysel satıcıya gider;
    // ilan detayı iletişim kutusunu buna göre seçiyor.
    const agent = row.category === "emlak" ? owners.agents[index % owners.agents.length] : null;
    const seller = agent ? null : owners.sellers[index % owners.sellers.length];

    // İlanların bir kısmında fiyat düşmüş olsun: PriceHistory boşken detay
    // sayfasındaki "Fiyat geçmişi" kartı hiç görünmüyor.
    const priceDrop = row.category === "emlak" && chance(0.22);
    const createdAt = new Date(Date.now() - ri(0, 90) * 86_400_000);

    await prisma.listing.create({
      data: {
        slug,
        title: row.title,
        description: row.description,
        category: row.category,
        propertyType: row.subType,
        listingType: "sale",
        status: chance(0.06) ? "sold" : "active",
        moderationStatus: "approved",
        price: row.price,
        currency: "TRY",
        district: row.district,
        neighborhood: row.neighborhood,
        areaGross: row.areaGross ?? null,
        areaNet: row.areaNet ?? null,
        rooms: row.rooms ?? null,
        floor: row.floor ?? null,
        totalFloors: row.totalFloors ?? null,
        buildingAge: row.buildingAge ?? null,
        heating: row.heating ?? null,
        zoningStatus: row.zoningStatus ?? null,
        deedStatus: row.deedStatus ?? null,
        // Konum yalnız emlakta: taşınabilir bir üründe koordinat hem yanlış
        // hem de satıcının ev adresini ima ediyor.
        lat: row.lat ?? null,
        lng: row.lng ?? null,
        locationVisibility: row.category === "emlak" ? "approximate" : "hidden",
        featured,
        // "Doğrulanmış" rozetinin tanımı tapu/ekspertiz doğrulaması
        // (admin/ListingForm.tsx). Emlak dışında karşılığı olmayan bir güven
        // işareti vermek rozeti değersizleştirir.
        verified: row.category === "emlak" ? chance(0.25) : false,
        attributes: row.attributes ?? undefined,
        ...sortableAttributeColumns(row.attributes),
        agentId: agent?.id ?? null,
        agencyId: agent?.agencyId ?? null,
        userId: seller?.id ?? null,
        // createdAt dağılımı: "yeni" rozeti hepsinde çıkmasın diye son 90 güne yayılıyor.
        createdAt,
        images: images.length
          ? { create: images.map((url, sortOrder) => ({ url, sortOrder })) }
          : undefined,
        amenities: row.amenities?.length
          ? { create: listingAmenityRows(row.amenities) }
          : undefined,
        priceHistory: {
          create: priceDrop
            ? [
                { price: Math.round((row.price * 1.08) / 1000) * 1000, createdAt },
                { price: row.price, createdAt: new Date(Date.now() - ri(0, 20) * 86_400_000) },
              ]
            : [{ price: row.price, createdAt }],
        },
      },
    });
    created++;
    if (created % 50 === 0) process.stdout.write(`  ${created}/${rows.length}\n`);
  }

  await ensureContent();
  await ensureActivity(owners);

  const dist = await prisma.listing.groupBy({ by: ["category"], _count: { _all: true } });
  console.log(`\n${created} ilan oluşturuldu.`);
  console.log("Kategori dağılımı:");
  for (const d of dist) console.log(`  ${d.category}: ${d._count._all}`);
}

/**
 * Alıcı tarafı etkinliği: favoriler, mesajlaşma, talepler ve kayıtlı aramalar.
 *
 * Bunlar ilan verisi DEĞİL ama ürünün yarısı: hesabım > mesajlar, favoriler ve
 * yönetim panelindeki talep listesi bunlar olmadan boş görünüyor. Her kayıt
 * gerçek bir ilana ve gerçek bir kullanıcıya bağlanıyor.
 */
async function ensureActivity(owners: Awaited<ReturnType<typeof ensureOwners>>) {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
    select: { id: true, title: true, price: true, category: true, district: true, agentId: true, userId: true },
  });
  if (!listings.length) return;

  // Alıcı, kendi ilanını favorileyip kendine mesaj atmasın.
  const buyerFor = (listing: (typeof listings)[number], offset: number) => {
    for (let i = 0; i < owners.sellers.length; i++) {
      const candidate = owners.sellers[(offset + i) % owners.sellers.length];
      if (candidate.id !== listing.userId) return candidate;
    }
    return owners.sellers[0];
  };

  let favorites = 0;
  for (const [index, listing] of listings.entries()) {
    if (!chance(0.18)) continue;
    const buyer = buyerFor(listing, index);
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: buyer.id, listingId: listing.id } },
      update: {},
      create: { userId: buyer.id, listingId: listing.id },
    });
    favorites++;
  }

  const OPENERS = [
    "Merhaba, ilan hâlâ güncel mi?",
    "Merhaba, hafta sonu yerinde görebilir miyim?",
    "İlgileniyorum, fiyatta esneklik var mı?",
    "Merhaba, detaylı bilgi alabilir miyim?",
  ];
  const REPLIES = [
    "Merhaba, ilan güncel. Hafta içi her saat müsaidim.",
    "Merhaba, ilgilendiğiniz için teşekkürler. Yerinde görmek için uygun olduğunuz günü yazabilirsiniz.",
    "Fiyat büyük ölçüde net, ciddi alıcıya küçük bir esneklik olabilir.",
  ];

  let conversations = 0;
  for (const [index, listing] of listings.entries()) {
    if (!chance(0.1)) continue;
    const buyer = buyerFor(listing, index + 7);
    const existing = await prisma.conversation.findFirst({
      where: { listingId: listing.id, userId: buyer.id },
      select: { id: true },
    });
    if (existing) continue;

    const startedAt = new Date(Date.now() - ri(1, 30) * 86_400_000);
    const replyAt = new Date(startedAt.getTime() + ri(1, 20) * 3_600_000);
    // Muhatap ilanın sahibi: emlakta danışman, diğerlerinde bireysel satıcı.
    const isAgentListing = !!listing.agentId;
    const withOffer = chance(0.35);

    await prisma.conversation.create({
      data: {
        listingId: listing.id,
        userId: buyer.id,
        agentId: listing.agentId,
        ownerUserId: isAgentListing ? null : listing.userId,
        createdAt: startedAt,
        lastMessageAt: replyAt,
        userReadAt: chance(0.6) ? replyAt : startedAt,
        agentReadAt: startedAt,
        messages: {
          create: [
            { senderRole: "user", type: "text", body: pick(OPENERS), createdAt: startedAt },
            {
              senderRole: isAgentListing ? "agent" : "owner",
              type: "text",
              body: pick(REPLIES),
              createdAt: replyAt,
            },
            ...(withOffer
              ? [{
                  senderRole: "user",
                  type: "offer",
                  offerAmount: Math.round((listing.price * ri(88, 97) / 100) / 1000) * 1000,
                  offerCurrency: "TRY",
                  offerStatus: "pending",
                  createdAt: new Date(replyAt.getTime() + ri(1, 12) * 3_600_000),
                }]
              : []),
          ],
        },
      },
    });
    conversations++;
  }

  // Talepler (yönetim panelindeki "Talepler" listesi) — emlak ilanlarına bağlı.
  const LEAD_TYPES = ["appointment", "expertise", "price_offer", "contact"];
  const realEstate = listings.filter((l) => l.category === "emlak");
  // Eşik "sıfır" değil: canlıda birkaç gerçek talep varken demo talepler hiç
  // üretilmiyordu ve yönetim panelindeki "Talepler" ekranı neredeyse boş kalıyordu.
  let leads = 0;
  if ((await prisma.lead.count()) < 10) {
    for (let i = 0; i < 24 && realEstate.length; i++) {
      const listing = realEstate[(i * 7) % realEstate.length];
      const buyer = buyerFor(listing, i + 3);
      const user = await prisma.user.findUnique({ where: { id: buyer.id }, select: { name: true, phone: true, email: true } });
      await prisma.lead.create({
        data: {
          type: LEAD_TYPES[i % LEAD_TYPES.length],
          name: user?.name ?? "Ziyaretçi",
          phone: user?.phone ?? demoPhone(i),
          email: user?.email ?? null,
          message: pick(["Hafta sonu müsait misiniz?", "Kredi kullanabilir miyim?", "Fiyatta pazarlık payı var mı?", "Detaylı bilgi rica ediyorum."]),
          district: listing.district,
          listingId: listing.id,
          userId: buyer.id,
          status: pick(["received", "received", "reviewing", "contacted", "closed"]),
          createdAt: new Date(Date.now() - ri(0, 45) * 86_400_000),
        },
      });
      leads++;
    }
  }

  // Kayıtlı aramalar — yeni emlak ilanı onaylandığında eşleşme bildirimi gider.
  let alerts = 0;
  if ((await prisma.buyerAlert.count()) < 3) {
    const criteria = [
      { propertyType: "daire", district: "Merkez", rooms: "3+1", maxPrice: 3_500_000 },
      { propertyType: "daire", district: "Tavşanlı", maxPrice: 2_200_000 },
      { propertyType: "arsa", district: "Altıntaş", maxPrice: 1_500_000, minArea: 1000 },
      { propertyType: "villa", district: "Merkez", minPrice: 4_000_000 },
      { propertyType: "isyeri", district: "Merkez", maxPrice: 5_000_000 },
    ];
    for (const [index, c] of criteria.entries()) {
      const buyer = owners.sellers[index % owners.sellers.length];
      const user = await prisma.user.findUnique({ where: { id: buyer.id }, select: { name: true, phone: true, email: true } });
      await prisma.buyerAlert.create({
        data: {
          ...c,
          name: user?.name ?? "Alıcı",
          phone: user?.phone ?? demoPhone(index),
          email: user?.email ?? null,
          userId: buyer.id,
          listingType: "sale",
          status: "active",
        },
      });
      alerts++;
    }
  }

  console.log(`Etkinlik: ${favorites} favori · ${conversations} mesajlaşma · ${leads} talep · ${alerts} kayıtlı arama`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
