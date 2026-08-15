// Daire ve villa için ELLE SEÇİLMİŞ Commons dosyalarından katalog üretir.
//
// NEDEN ELLE: Commons'ta modern konut İÇ MEKÂNI yok denecek kadar az. 56 aday
// arasından yalnız 8'i kullanılabilirdi; gerisi tarihi otel kartpostalı, umumi
// tuvalet, müze salonu, anaokulu. Arama tabanlı çözümleme de genel kavramlarda
// şaşırıyor ("Modern kitchens" -> "Kochmaschine" adlı soba kategorisi).
//
// KURGU: İlan kartı yalnız İLK fotoğrafı gösteriyor. Bu yüzden her ilanın kapağı
// FARKLI bir bina dış cephesi, galerisi ise ortak iç mekân havuzundan besleniyor.
// Böylece listeleme ekranı çeşitli görünüyor, tekrar yalnız detay galerisinde ve
// orada da rahatsız etmiyor — gerçek ilanlarda da benzer daireler benzer görünür.
import { execFileSync } from "node:child_process";

/** Kategori -> commons-fetch sırasındaki 1-tabanlı seçim indeksleri. */
const COVERS_APARTMENT = [
  ["Apartment buildings in Germany", [1, 2, 3]],
  ["Apartment buildings in Turkey", [3, 4, 7]],
  ["Housing estates in Germany", [2, 3, 4, 5, 6, 7]],
  ["Residential buildings in Ankara", [1]],
  ["Apartment buildings in Poland", [1, 3, 4, 6, 7, 8, 10]],
  ["Apartment buildings in Spain", [1, 2, 5, 6, 10]],
  ["Blocks of flats", [2, 3, 4, 5, 6, 7, 9, 10]],
  ["Housing estates in Poland", [7, 8, 9, 10]],
];

const COVERS_VILLA = [
  ["Detached houses", [1, 2, 3, 4, 5]],
  ["Villas", [2, 3]],
  ["Bungalows", [3, 4, 5]],
  ["Houses in Germany", [1, 3, 5]],
  ["Swimming pools", [5, 6]],
];

const INTERIORS = [
  ["Bedrooms", [1, 3]],
  ["Kitchens", [1, 6]],
  ["Living rooms", [7, 8]],
  ["Home offices", [3, 4]],
];

const DAIRE_LABELS = [
  "Ara kat daire", "Güneşli cephe", "Site içinde daire", "Yeni bina daire",
  "Geniş balkonlu daire", "Merkezi konumda daire", "Asansörlü bina", "Otoparklı site",
  "Bakımlı daire", "Ferah daire", "Yüksek katta daire", "Sıfır bina daire",
  "Aile dairesi", "Yatırımlık daire", "Kombili daire", "Cadde üzeri daire",
];
const VILLA_LABELS = [
  "Bahçeli villa", "Havuzlu villa", "Müstakil girişli villa", "Manzaralı villa",
  "Çift garajlı villa", "Teraslı villa", "Doğayla iç içe villa", "Geniş bahçeli villa",
  "Modern mimari villa", "Şehre yakın villa", "Site içinde villa", "Ferah villa",
  "Yeni yapı villa", "Aile villası",
];

function fetchCategory(category, limit) {
  try {
    const out = execFileSync("node", ["scripts/commons-fetch.mjs", category, String(limit)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 240_000,
    });
    return JSON.parse(out);
  } catch {
    return [];
  }
}

/** Seçim listesini gerçek URL'lere çevirir; bulunamayan indeksler sessizce düşer. */
function collect(picks, pull) {
  const urls = [];
  for (const [category, indexes] of picks) {
    const files = fetchCategory(category, pull);
    const chosen = indexes.map((i) => files[i - 1]?.url).filter(Boolean);
    process.stderr.write(`  ${String(chosen.length).padStart(2)}/${indexes.length}  ${category}\n`);
    urls.push(...chosen);
  }
  return urls;
}

process.stderr.write("İç mekânlar:\n");
const interiors = collect(INTERIORS, 8);
process.stderr.write("Daire kapakları:\n");
const daireCovers = collect(COVERS_APARTMENT, 10);
process.stderr.write("Villa kapakları:\n");
const villaCovers = collect(COVERS_VILLA, 6);

if (!interiors.length) {
  process.stderr.write("UYARI: hiç iç mekân bulunamadı, ilanlar yalnız dış cepheyle kalacak\n");
}

/** Kapak + havuzdan 2 iç mekân; iç mekânlar döngüsel dağıtılıyor. */
function build(covers, labels) {
  return covers.map((cover, index) => ({
    label: labels[index % labels.length],
    files: [
      cover,
      ...(interiors.length
        ? [interiors[(index * 2) % interiors.length], interiors[(index * 2 + 1) % interiors.length]]
        : []),
    ].filter((v, i, arr) => arr.indexOf(v) === i),
  }));
}

const catalog = {
  "emlak-daire": build(daireCovers, DAIRE_LABELS),
  "emlak-villa": build(villaCovers, VILLA_LABELS),
};

for (const [k, v] of Object.entries(catalog)) {
  process.stderr.write(`\n${k}: ${v.length} ürün, ${v.reduce((n, i) => n + i.files.length, 0)} dosya\n`);
}
process.stdout.write(JSON.stringify(catalog, null, 2));
