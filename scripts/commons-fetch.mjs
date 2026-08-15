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

/** Dosya adına bakarak ilanda kullanılamayacak olanları eler. */
const REJECT = /(interior of|engine|dashboard|logo|badge|emblem|wheel|diagram|drawing|blueprint|schematic|patent|crash|accident|wreck|museum|toy|model car|scale model|assembly|production line|rear light|headlight|taillight|tail light|gauge|odometer|screenshot|advert|billboard)/i;

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

const [first, ...rest] = process.argv.slice(2);
if (!first) {
  console.error('kullanım: node scripts/commons-fetch.mjs "<Kategori>" [adet]  |  --search "<terim>"');
  process.exit(1);
}

if (first === "--search") {
  const cats = await searchCategories(rest.join(" "));
  console.log(cats.join("\n"));
} else {
  const limit = Number(rest[0]) || 4;
  const files = await filesInCategory(first, limit);
  console.log(JSON.stringify(files, null, 2));
  console.error(`${files.length} uygun dosya`);
}
