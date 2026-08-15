// Demo görsellerini gözle denetlemek için kontak sayfası üretir.
//
// Görsel kalitesini otomatik doğrulamanın yolu yok: dosya adı "Renault Clio"
// diyorken fotoğrafın motor bölmesi yakın çekimi olması sık rastlanan bir durum.
// Bu yüzden indirilen her set, ızgaraya dizilip GÖZLE kontrol ediliyor.
//
// Kullanım:
//   node scripts/contact-sheet.mjs <dizin> <çıktı.jpg> [satırBaşınaDosya] [desen]
//
// Örnek:
//   node scripts/contact-sheet.mjs public/uploads /tmp/otomobil.jpg 5 'demo-otomobil'
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const [dir, out, colsArg, pattern] = process.argv.slice(2);
if (!dir || !out) {
  console.error("kullanım: node scripts/contact-sheet.mjs <dizin> <çıktı.jpg> [sütun] [desen]");
  process.exit(1);
}

const COLS = Number(colsArg) || 5;
const W = 240;
const H = 180;
const LABEL = 18;

const all = await readdir(dir);
const files = all
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .filter((f) => (pattern ? f.includes(pattern) : true))
  .sort();

if (!files.length) {
  console.error(`eşleşen dosya yok: ${dir} ${pattern ?? ""}`);
  process.exit(1);
}

const rows = Math.ceil(files.length / COLS);
const cellH = H + LABEL;
const composites = [];

for (const [index, file] of files.entries()) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  try {
    const buf = await sharp(path.join(dir, file)).resize(W, H, { fit: "cover" }).png().toBuffer();
    composites.push({ input: buf, left: col * W, top: row * cellH });
  } catch {
    // Bozuk/okunamayan dosya: kırmızı hücre bırak, ızgara kaymasın.
    const bad = await sharp({ create: { width: W, height: H, channels: 3, background: "#c0392b" } })
      .png()
      .toBuffer();
    composites.push({ input: bad, left: col * W, top: row * cellH });
  }
  const label = Buffer.from(
    `<svg width="${W}" height="${LABEL}"><rect width="${W}" height="${LABEL}" fill="#111"/>` +
      `<text x="4" y="13" font-family="monospace" font-size="11" fill="#eee">` +
      `${file.replace(/\.[a-z]+$/i, "").slice(-34).replace(/[<&>]/g, "")}</text></svg>`,
  );
  composites.push({ input: label, left: col * W, top: row * cellH + H });
}

await sharp({
  create: { width: W * COLS, height: cellH * rows, channels: 4, background: "#ffffff" },
})
  .composite(composites)
  .jpeg({ quality: 76 })
  .toFile(out);

console.log(`${files.length} görsel → ${out} (${COLS}x${rows})`);
