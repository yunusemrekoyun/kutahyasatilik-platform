import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = join(process.cwd(), ".next", "standalone");
const forbiddenDirectories = new Set([
  ".agents",
  "docs",
  "kutahyasatilik ilan",
  "public/uploads",
  "rapor",
  "prisma/migrations",
]);
const maxBytes = Number(process.env.STANDALONE_MAX_MB || 250) * 1024 * 1024;
let total = 0;
const violations = [];

function normalizePath(value) {
  return value
    .normalize("NFC")
    .replaceAll("\\", "/")
    .toLocaleLowerCase("tr-TR");
}

function isForbiddenPath(value) {
  const segments = value.split("/");
  if (segments.some((segment) => segment === ".env" || segment.startsWith(".env."))) {
    return true;
  }
  return [...forbiddenDirectories].some(
    (name) =>
      value === name ||
      value.startsWith(`${name}/`) ||
      value.includes(`/${name}/`) ||
      value.endsWith(`/${name}`),
  );
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    const rel = relative(root, absolute).replaceAll("\\", "/");
    const normalizedRel = normalizePath(rel);
    if (isForbiddenPath(normalizedRel)) {
      violations.push(rel);
      continue;
    }
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
