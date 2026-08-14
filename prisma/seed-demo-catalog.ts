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
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getUploadDir } from "../lib/uploads";

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
// Kütahya coğrafyası
// ---------------------------------------------------------------------------
// Merkez ağırlıklı dağılım — gerçek bir portföyde ilanların çoğu merkezde olur.
const DISTRICT_WEIGHTS: [string, number][] = [
  ["Merkez", 42], ["Tavşanlı", 12], ["Simav", 10], ["Gediz", 8], ["Emet", 5],
  ["Domaniç", 4], ["Hisarcık", 4], ["Altıntaş", 4], ["Aslanapa", 3],
  ["Dumlupınar", 2], ["Çavdarhisar", 2], ["Pazarlar", 2], ["Şaphane", 2],
];
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
// Görseller — kategoriye uygun, bir kez indirilip UPLOAD_DIR'e yazılır
// ---------------------------------------------------------------------------
const IMAGE_TOPICS: Record<string, string> = {
  daire: "apartment,livingroom",
  villa: "villa,house",
  mustakil: "house,garden",
  arsa: "land,meadow",
  tarla: "farm,field",
  isyeri: "office,shop",
  otomobil: "car",
  motosiklet: "motorcycle",
  ticari: "van,truck",
  traktor: "tractor",
  telefon: "smartphone",
  bilgisayar: "laptop",
  tablet: "tablet,ipad",
  konsol: "videogame,console",
  kamera: "camera,photography",
};
const IMAGES_PER_TOPIC = 6;

/** Konu başına birkaç görsel indirir; dosya varsa atlar. Ağ yoksa sessizce boş döner. */
async function ensureImages(): Promise<Record<string, string[]>> {
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  const pools: Record<string, string[]> = {};

  for (const [topic, keywords] of Object.entries(IMAGE_TOPICS)) {
    pools[topic] = [];
    for (let i = 0; i < IMAGES_PER_TOPIC; i++) {
      const name = `demo-${topic}-${i}.jpg`;
      const full = path.join(dir, name);
      const url = `/uploads/${name}`;
      try {
        await access(full);
        pools[topic].push(url); // zaten var
        continue;
      } catch {
        /* indirilecek */
      }
      if (NO_IMAGES) continue;
      try {
        // loremflickr: anahtar kelimeye göre CC lisanslı fotoğraf. `lock` aynı
        // görseli tekrar verir, yani katalog koşudan koşuya değişmez.
        const res = await fetch(
          `https://loremflickr.com/900/675/${encodeURIComponent(keywords)}?lock=${topic.length * 100 + i}`,
          { redirect: "follow" },
        );
        if (!res.ok) throw new Error(String(res.status));
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 2000) throw new Error("gorsel cok kucuk");
        await writeFile(full, buf);
        pools[topic].push(url);
        process.stdout.write(".");
      } catch {
        process.stdout.write("x");
      }
    }
  }
  process.stdout.write("\n");
  return pools;
}

// ---------------------------------------------------------------------------
// Emlak
// ---------------------------------------------------------------------------
const ROOMS = ["1+1", "2+1", "3+1", "4+1", "5+1"];
const HEATING = ["Doğalgaz kombi", "Merkezi", "Yerden ısıtma", "Klima", "Soba"];
const ZONING = ["Konut", "Ticari", "Konut + Ticari", "İmara açık", "Tarla vasfında"];
const DEED = ["Kat mülkiyeti", "Kat irtifakı", "Arsa tapulu", "Müstakil tapu"];

function realEstate() {
  const subType = pick(["daire", "daire", "daire", "villa", "mustakil", "arsa", "tarla", "isyeri"]);
  const district = weightedDistrict();
  const neighborhood = neighborhoodFor(district);
  const isLand = subType === "arsa" || subType === "tarla";
  const isCommercial = subType === "isyeri";
  const central = district === "Merkez";

  const area = isLand ? ri(500, 12000) : subType === "villa" ? ri(180, 420) : isCommercial ? ri(45, 400) : ri(65, 210);
  const rooms = isLand || isCommercial ? null : pick(ROOMS);
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
    district,
    neighborhood,
    title: `${district}${central ? "" : ""} ${neighborhood} Mahallesi'nde ${label} | ${isLand ? `${area} m²` : `${area} m²`} — ${flavour}`.slice(0, 140),
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
      `${district} ${neighborhood} Mahallesi'nde ${label.toLowerCase()}. ${flavour}. ` +
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
  ["Türk Traktör", ["Fiat 480", "Tümosan 8075"]],
];
const COLORS = ["Beyaz", "Siyah", "Gri", "Gümüş", "Kırmızı", "Lacivert", "Mavi"];

function vehicle() {
  const subType = pick(["otomobil", "otomobil", "otomobil", "motosiklet", "ticari", "traktor"]);
  const table = subType === "otomobil" ? CARS : subType === "motosiklet" ? BIKES : subType === "ticari" ? VANS : TRACTORS;
  const [marka, models] = pick(table);
  const model = pick(models);
  const yil = subType === "traktor" ? ri(1995, 2024) : ri(2008, 2025);
  const age = Math.max(0, 2026 - yil);
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
  const renk = pick(COLORS);
  const district = weightedDistrict();

  const flavour = pick([
    "Tek elden, bakımları yetkili serviste",
    "Değişensiz, hatasız",
    "Zamanı gelen bakımları yapıldı",
    "Garaj arabası, az kullanılmış",
    "Takas olur, kredi kullanılabilir",
    "Muayenesi yeni yapıldı",
  ]);

  return {
    subType,
    district,
    neighborhood: neighborhoodFor(district),
    title: `${yil} ${marka} ${model} — ${flavour}`.slice(0, 140),
    price,
    description:
      `${yil} model ${marka} ${model}. ${kilometre.toLocaleString("tr-TR")} km'de, ${renk.toLowerCase()} renk. ` +
      `${flavour}. Görüşmeye açık, ilanda yazan fiyat üzerinden pazarlık payı vardır. ` +
      `Aracı Kütahya ${district}'de yerinde görebilirsiniz.`,
    attributes: { marka, model, yil, kilometre, yakit, vites, renk, hasar },
  };
}

// ---------------------------------------------------------------------------
// Teknoloji
// ---------------------------------------------------------------------------
const PHONES: [string, string[], number][] = [
  ["Apple", ["iPhone 13 128 GB", "iPhone 14 Pro 256 GB", "iPhone 15 128 GB", "iPhone 12 64 GB"], 38_000],
  ["Samsung", ["Galaxy S23 256 GB", "Galaxy A54 128 GB", "Galaxy S22 Ultra 256 GB"], 26_000],
  ["Xiaomi", ["Redmi Note 13 Pro 256 GB", "Poco X6 256 GB", "13T 256 GB"], 14_000],
];
const COMPUTERS: [string, string[], number][] = [
  ["Apple", ["MacBook Air M2 8/256", "MacBook Pro 14 M3 16/512"], 48_000],
  ["Lenovo", ["ThinkPad E14 Gen 5", "IdeaPad Gaming 3 RTX 3050"], 26_000],
  ["Asus", ["TUF Gaming F15 RTX 4060", "Vivobook 15 i5"], 28_000],
  ["HP", ["Victus 15 RTX 3050", "Pavilion 14 i5"], 24_000],
];
const TABLETS: [string, string[], number][] = [
  ["Apple", ["iPad 10. Nesil 64 GB", "iPad Air M1 64 GB"], 22_000],
  ["Samsung", ["Galaxy Tab S9 FE 128 GB", "Galaxy Tab A9+ 64 GB"], 14_000],
  ["Xiaomi", ["Redmi Pad SE 128 GB"], 8_000],
];
const CONSOLES: [string, string[], number][] = [
  ["Sony", ["PlayStation 5 Slim 1 TB", "PlayStation 4 Pro 1 TB"], 26_000],
  ["Microsoft", ["Xbox Series S 512 GB", "Xbox Series X 1 TB"], 20_000],
  ["Nintendo", ["Switch OLED", "Switch Lite"], 14_000],
];
const CAMERAS: [string, string[], number][] = [
  ["Canon", ["EOS R10 + 18-45 mm", "EOS 250D + 18-55 mm"], 32_000],
  ["Nikon", ["Z50 + 16-50 mm", "D5600 + 18-140 mm"], 30_000],
  ["Sony", ["Alpha A6400 + 16-50 mm", "ZV-E10 Body"], 34_000],
];

function tech() {
  const subType = pick(["telefon", "telefon", "bilgisayar", "bilgisayar", "tablet", "konsol", "kamera"]);
  const table =
    subType === "telefon" ? PHONES
    : subType === "bilgisayar" ? COMPUTERS
    : subType === "tablet" ? TABLETS
    : subType === "konsol" ? CONSOLES
    : CAMERAS;
  const [marka, models, base] = pick(table);
  const model = pick(models);
  const durum = chance(0.28) ? "sifir" : "ikinci_el";
  const garanti = durum === "sifir" ? "var" : chance(0.45) ? "var" : "yok";
  const kutu = chance(0.6) ? "tam" : "eksik";
  const price = Math.max(
    Math.round((base * (durum === "sifir" ? 1 : ri(58, 88) / 100)) / 500) * 500,
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

  return {
    subType,
    district,
    neighborhood: neighborhoodFor(district),
    title: `${marka} ${model} — ${flavour}`.slice(0, 140),
    price,
    description:
      `${marka} ${model}. ${durum === "sifir" ? "Sıfır ürün" : "İkinci el"}, ${flavour.toLowerCase()}. ` +
      `${garanti === "var" ? "Garantisi devam ediyor." : "Garanti süresi dolmuştur."} ` +
      `${kutu === "tam" ? "Kutusu ve aksesuarları tam." : "Kutusu yok, temel aksesuarlar mevcut."} ` +
      `Kütahya ${district}'de elden teslim, kargo da yapılabilir.`,
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

  if (RESET) {
    // Listing silinince ListingImage/Amenity/PriceHistory/Favorite/Conversation
    // cascade ile gider; Lead ve AnalyticsEvent SET NULL ile korunur.
    const { count } = await prisma.listing.deleteMany({});
    console.log(`  ${count} mevcut ilan silindi`);
  }

  const owners = await ensureOwners();

  console.log("Görseller hazırlanıyor (indirilenler nokta, atlananlar x):");
  const pools = await ensureImages();
  const havePools = Object.values(pools).filter((p) => p.length).length;
  console.log(`  ${havePools}/${Object.keys(IMAGE_TOPICS).length} konu için görsel havuzu hazır`);

  // Dağılım: emlak yarısı, vasıta üçte biri, teknoloji kalanı.
  const nEmlak = Math.round(TOTAL * 0.5);
  const nVasita = Math.round(TOTAL * 0.3);
  const nTeknoloji = TOTAL - nEmlak - nVasita;

  const rows: {
    category: string; subType: string; district: string; neighborhood: string;
    title: string; price: number; description: string;
    attributes: Record<string, string | number> | null;
    areaGross?: number | null; areaNet?: number | null; rooms?: string | null;
    floor?: string | null; totalFloors?: number | null; buildingAge?: string | null;
    heating?: string | null; zoningStatus?: string | null; deedStatus?: string | null;
  }[] = [];

  for (let i = 0; i < nEmlak; i++) rows.push({ category: "emlak", ...realEstate() });
  for (let i = 0; i < nVasita; i++) rows.push({ category: "vasita", ...vehicle() });
  for (let i = 0; i < nTeknoloji; i++) rows.push({ category: "teknoloji", ...tech() });

  let created = 0;
  const usedSlugs = new Set<string>();
  for (const [index, row] of rows.entries()) {
    let slug = slugify(row.title);
    if (!slug || usedSlugs.has(slug)) slug = `${slug || "ilan"}-${index}`;
    usedSlugs.add(slug);

    const pool = pools[row.subType] ?? [];
    // 3-5 görsel; havuz küçükse döngüsel dağıtım (her ilan aynı sırayla başlamasın).
    const imageCount = pool.length ? Math.min(pool.length, ri(3, 5)) : 0;
    const offset = index % Math.max(pool.length, 1);
    const images = Array.from({ length: imageCount }, (_, k) => pool[(offset + k) % pool.length]);

    // Vitrin oranı ~%12 — hepsi vitrinse vitrin anlamını yitirir.
    const featured = chance(0.12);

    // Sahip ataması. Emlak ilanı danışmana, diğerleri bireysel satıcıya gider;
    // ilan detayı iletişim kutusunu buna göre seçiyor.
    const agent = row.category === "emlak" ? owners.agents[index % owners.agents.length] : null;
    const seller = agent ? null : owners.sellers[index % owners.sellers.length];

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
        locationVisibility: "approximate",
        featured,
        verified: chance(0.25),
        attributes: row.attributes ?? undefined,
        agentId: agent?.id ?? null,
        agencyId: agent?.agencyId ?? null,
        userId: seller?.id ?? null,
        // createdAt dağılımı: "yeni" rozeti hepsinde çıkmasın diye son 90 güne yayılıyor.
        createdAt: new Date(Date.now() - ri(0, 90) * 86_400_000),
        images: images.length
          ? { create: images.map((url, sortOrder) => ({ url, sortOrder })) }
          : undefined,
      },
    });
    created++;
    if (created % 50 === 0) process.stdout.write(`  ${created}/${rows.length}\n`);
  }

  const dist = await prisma.listing.groupBy({ by: ["category"], _count: { _all: true } });
  console.log(`\n${created} ilan oluşturuldu.`);
  console.log("Kategori dağılımı:");
  for (const d of dist) console.log(`  ${d.category}: ${d._count._all}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
