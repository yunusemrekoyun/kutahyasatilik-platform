// Wikimedia Commons kategorisinden ilan görseline uygun dosyaları listeler.
//
// Kürasyon ajanlarının çıktısını tamamlamak ve elle doğrulama yapmak için.
// HİÇBİR ŞEY İNDİRMEZ, yalnız uygun dosyaların URL'lerini basar.
//
// Kullanım:
//   node scripts/commons-fetch.mjs "Renault Clio IV" 6
//   node scripts/commons-fetch.mjs --search "Massey Ferguson tractor"
import process from "node:process";

const UA = "KutahyaSatilikDemoSeed/1.0 (https://kutahyasatilik.com; demo catalog seeding)";
const MIN_WIDTH = 1000;

async function api(params) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

/**
 * Dosya adına bakarak ilanda kullanılamayacak olanları eler.
 *
 * Mağaza/fuar deseni özellikle telefon ve tablette kritik: Commons'taki
 * ürün fotoğraflarının büyük kısmı MWC standı ya da market rafı çekimi ve
 * kadrajda yabancı para birimiyle fiyat etiketleri oluyor. Bir ilanda
 * "kutusu açılmamış" derken vitrin sırası göstermek ilanı sahte gösterir.
 */
const REJECT = new RegExp(
  [
    // parça / detay çekimi
    "interior of|engine|dashboard|wheel|rear light|headlight|taillight|tail light|gauge|odometer|close-?up|detail",
    // marka işareti ve grafik
    "logo|badge|emblem|diagram|drawing|blueprint|schematic|patent|icon|screenshot|advert|billboard|poster",
    // hasarlı / gerçek dışı
    "crash|accident|wreck|damaged|burn|rust|abandoned|museum|toy|model car|scale model|replica",
    // üretim ve perakende ortamı
    "assembly|production line|factory|shop|store|shelf|display|booth|stand|fair|expo|exhibition|MWC|IFA|CES|showroom|retail|market",
  ].join("|"),
  "i",
);

async function filesInCategory(category, limit) {
  const seen = [];
  let cont;
  do {
    const data = await api({
      action: "query",
      list: "categorymembers",
      cmtitle: category.startsWith("Category:") ? category : `Category:${category}`,
      cmtype: "file",
      cmlimit: "200",
      ...(cont ? { cmcontinue: cont } : {}),
    });
    seen.push(...(data.query?.categorymembers ?? []).map((m) => m.title));
    cont = data.continue?.cmcontinue;
  } while (cont && seen.length < 400);

  const usable = [];
  for (let i = 0; i < seen.length && usable.length < limit; i += 20) {
    const batch = seen.slice(i, i + 20).filter((t) => !REJECT.test(t));
    if (!batch.length) continue;
    const info = await api({
      action: "query",
      prop: "imageinfo",
      iiprop: "url|size|mime",
      titles: batch.join("|"),
    });
    for (const page of Object.values(info.query?.pages ?? {})) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      // Yatay ve yeterince büyük olmalı: dikey fotoğraf ilan kartında kırpılınca
      // ürünün yarısı kayboluyor.
      if (ii.mime !== "image/jpeg") continue;
      if (ii.width < MIN_WIDTH || ii.width <= ii.height) continue;
      usable.push({ title: page.title, url: ii.url, width: ii.width, height: ii.height });
      if (usable.length >= limit) break;
    }
  }
  return usable;
}

async function searchCategories(term) {
  const data = await api({ action: "query", list: "search", srnamespace: "14", srsearch: term, srlimit: "20" });
  return (data.query?.search ?? []).map((s) => s.title);
}

/**
 * Model adından çalışan kategoriyi BULUR.
 *
 * Kategori adları Commons'ta öngörülemez ("Ford Focus III" yok ama
 * "Ford Focus (third generation)" var). Ad tahmin etmek yerine arama sonuçlarını
 * sırayla deneyip yeterli sayıda uygun dosya döndüren ilk kategoriyi seçiyoruz.
 */
/**
 * Kategori adı seviyesinde eleme.
 *
 * Arama "Ford Focus" için ilk sırada "Ford Focus WRC"yi döndürüyor; ralli aracı
 * ikinci el ilanı için yanlış. Aynı şekilde konsept, prototip, polis/taksi
 * donanımlı ve askeri sürümler de ilan görseli olamaz.
 */
const REJECT_CATEGORY =
  /(WRC|\bR5\b|\bN5\b|rally|racing|race|motorsport|concept|prototype|police|taxi|military|army|ambulance|fire department|hearse|tuning|modified|crash|museum|replica|scale model|interior|engine)/i;

async function resolveCategory(term, need) {
  const candidates = (await searchCategories(term)).filter((c) => !REJECT_CATEGORY.test(c));
  for (const cat of candidates.slice(0, 8)) {
    // Alt kategorilere inmeyen, doğrudan dosya tutan kategoriler işimizi görür.
    const files = await filesInCategory(cat, need);
    if (files.length >= need) return { category: cat, files };
  }
  // Hiçbiri yetmediyse en iyisini döndür (kısmi sonuç, hiç yoktan iyi).
  let best = { category: null, files: [] };
  for (const cat of candidates.slice(0, 8)) {
    const files = await filesInCategory(cat, need);
    if (files.length > best.files.length) best = { category: cat, files };
  }
  return best;
}

const [first, ...rest] = process.argv.slice(2);
if (!first) {
  console.error('kullanım: node scripts/commons-fetch.mjs "<Kategori>" [adet] | --search "<terim>" | --resolve "<model>" [adet]');
  process.exit(1);
}

if (first === "--search") {
  const cats = await searchCategories(rest.join(" "));
  console.log(cats.join("\n"));
} else if (first === "--resolve") {
  const need = Number(rest[rest.length - 1]) || 3;
  const term = (Number(rest[rest.length - 1]) ? rest.slice(0, -1) : rest).join(" ");
  const { category, files } = await resolveCategory(term, need);
  console.log(JSON.stringify({ term, category, files }, null, 2));
  console.error(`${term} -> ${category ?? "BULUNAMADI"} (${files.length} dosya)`);
} else {
  const limit = Number(rest[0]) || 4;
  const files = await filesInCategory(first, limit);
  console.log(JSON.stringify(files, null, 2));
  console.error(`${files.length} uygun dosya`);
}
