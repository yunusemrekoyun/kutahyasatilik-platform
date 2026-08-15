// Telefon ve tablet için ELLE SEÇİLMİŞ Commons dosyalarından katalog parçası üretir.
//
// Neden elle: bu iki alt türde Commons'taki fotoğrafların çoğu mağaza vitrini,
// fuar standı, anakart yakın çekimi ya da yanlış etiketlenmiş içerik. Dosya adına
// bakan bir filtre bunları ayırt edemiyor ("IPhone_15-13410" adı, kadrajda dört
// telefonun vitrinde dizili olduğunu söylemiyor). Aşağıdaki seçim, adayların
// kontak sayfası üzerinden tek tek görülerek yapıldı.
//
// SEÇIM biçimi: [kategori, [1-tabanlı indeksler]] — indeks, commons-fetch.mjs'in
// o kategori için döndürdüğü sıradaki yeri gösterir.
//
// Kullanım: node scripts/build-tech-catalog.mjs > /tmp/tech.json
import { execFileSync } from "node:child_process";

const PICKS = {
  "teknoloji-telefon": [
    { cat: "IPhone 11", take: [1], marka: "Apple", model: "iPhone 11 128 GB", durum: "ikinci_el" },
    { cat: "IPhone 13", take: [1, 3], marka: "Apple", model: "iPhone 13 128 GB", durum: "ikinci_el" },
    { cat: "IPhone 14", take: [1], marka: "Apple", model: "iPhone 14 256 GB", durum: "ikinci_el" },
    { cat: "IPhone 15", take: [1, 2, 3], marka: "Apple", model: "iPhone 15 128 GB", durum: "sifir" },
    { cat: "IPhone SE (2nd generation)", take: [3], marka: "Apple", model: "iPhone SE 64 GB", durum: "ikinci_el" },
    { cat: "Samsung Galaxy S21", take: [1, 2], marka: "Samsung", model: "Galaxy S21 256 GB", durum: "ikinci_el" },
    { cat: "Samsung Galaxy S23", take: [1], marka: "Samsung", model: "Galaxy S23 256 GB", durum: "sifir" },
    { cat: "Huawei P30", take: [2], marka: "Huawei", model: "P30 128 GB", durum: "ikinci_el" },
  ],
  "teknoloji-tablet": [
    { cat: "IPad Air", take: [1, 3], marka: "Apple", model: "iPad Air 64 GB", durum: "ikinci_el" },
    { cat: "IPad (10th generation)", take: [1], marka: "Apple", model: "iPad 10. Nesil 64 GB", durum: "sifir" },
    { cat: "Samsung Galaxy Tab S9", take: [1], marka: "Samsung", model: "Galaxy Tab S9 FE 128 GB", durum: "ikinci_el" },
  ],
};

/** commons-fetch.mjs çıktısını okur; seçim indeksleri bu sıraya göre. */
function fetchCategory(category, limit = 3) {
  const out = execFileSync("node", ["scripts/commons-fetch.mjs", category, String(limit)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return JSON.parse(out);
}

const catalog = {};
for (const [key, picks] of Object.entries(PICKS)) {
  catalog[key] = [];
  for (const pick of picks) {
    const files = fetchCategory(pick.cat);
    const chosen = pick.take.map((i) => files[i - 1]?.url).filter(Boolean);
    if (!chosen.length) {
      process.stderr.write(`ATLANDI (dosya bulunamadı): ${pick.cat}\n`);
      continue;
    }
    catalog[key].push({
      label: `${pick.marka} ${pick.model}`,
      marka: pick.marka,
      model: pick.model,
      durum: pick.durum,
      files: chosen,
    });
    process.stderr.write(`${pick.cat}: ${chosen.length} dosya\n`);
  }
}

process.stdout.write(JSON.stringify(catalog, null, 2));
