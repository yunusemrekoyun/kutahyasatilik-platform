// Model/konu listesinden Commons kataloğu üretir.
//
// Kategori adları elle yazılmıyor: commons-fetch --resolve, arama sonuçlarını
// sırayla deneyip yeterli sayıda uygun dosya döndüren ilk kategoriyi seçiyor.
// Bunun sebebi Commons kategori adlandırmasının öngörülemez olması —
// "Ford Focus III" yok ama "Ford Focus Mk I" var.
//
// Kullanım:
//   node scripts/build-catalog.mjs specs/vasita-otomobil.json > /tmp/otomobil.json
//
// Girdi dosyası biçimi:
//   { "key": "vasita-otomobil",
//     "photos": 4,
//     "items": [ { "term": "Renault Clio IV", "marka": "Renault",
//                  "model": "Clio 1.5 dCi", "yil": 2015, "renk": "Beyaz" } ] }
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const specPath = process.argv[2];
if (!specPath) {
  console.error("kullanım: node scripts/build-catalog.mjs <spec.json>");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const photos = spec.photos ?? 4;

function resolve(term, need) {
  try {
    const out = execFileSync("node", ["scripts/commons-fetch.mjs", "--resolve", term, String(need)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 180_000,
    });
    return JSON.parse(out);
  } catch {
    return { category: null, files: [] };
  }
}

const items = [];
for (const item of spec.items) {
  const { category, files } = resolve(item.term, photos);
  if (!files.length) {
    process.stderr.write(`  BOŞ    ${item.term}\n`);
    continue;
  }
  process.stderr.write(`  ${String(files.length).padStart(2)} dosya  ${item.term.padEnd(34)} <- ${category}\n`);
  const { term: _term, ...attrs } = item;
  void _term;
  items.push({
    label: item.label ?? [item.marka, item.model].filter(Boolean).join(" ") ?? item.term,
    ...attrs,
    files: files.map((f) => f.url),
  });
}

process.stderr.write(`\n${spec.key}: ${items.length}/${spec.items.length} ürün, ${items.reduce((n, i) => n + i.files.length, 0)} dosya\n`);
process.stdout.write(JSON.stringify({ [spec.key]: items }, null, 2));
