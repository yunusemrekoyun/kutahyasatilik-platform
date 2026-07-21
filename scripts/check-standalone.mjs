import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = join(process.cwd(), ".next", "standalone");
const forbidden = ["docs", "rapor", ".agents", "prisma/migrations", "public/uploads"];
const maxBytes = Number(process.env.STANDALONE_MAX_MB || 250) * 1024 * 1024;
let total = 0;
const violations = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    const rel = relative(root, absolute).replaceAll("\\", "/");
    if (forbidden.some((name) => rel === name || rel.endsWith(`/${name}`))) violations.push(rel);
    if (entry.isDirectory()) await walk(absolute);
    else total += (await stat(absolute)).size;
  }
}

try {
  await walk(root);
} catch (error) {
  console.error("Standalone çıktı bulunamadı. Önce npm run build çalıştırın.", error);
  process.exit(1);
}

const sizeMb = total / 1024 / 1024;
if (violations.length || total > maxBytes) {
  console.error(`Standalone doğrulaması başarısız (${sizeMb.toFixed(1)} MB).`, { violations });
  process.exit(1);
}
console.log(`Standalone doğrulandı: ${sizeMb.toFixed(1)} MB, yasak klasör yok.`);
