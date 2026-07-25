import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const standaloneRoot = resolve(projectRoot, ".next", "standalone");
const removableNames = new Set([".agents", "docs", "rapor"]);

if (!standaloneRoot.startsWith(`${projectRoot}/.next/`)) {
  throw new Error("Standalone output path is outside the expected build directory.");
}

const removed = [];
for (const entry of await readdir(standaloneRoot, { withFileTypes: true })) {
  const normalizedName = entry.name.normalize("NFC").toLocaleLowerCase("tr-TR");
  const isEnvironmentFile =
    normalizedName === ".env" || normalizedName.startsWith(".env.");
  const isLocalPortfolioArtifact = normalizedName === "kutahyasatilik ilan";

  if (
    isEnvironmentFile ||
    isLocalPortfolioArtifact ||
    removableNames.has(normalizedName)
  ) {
    const target = resolve(standaloneRoot, entry.name);
    if (!target.startsWith(`${standaloneRoot}/`)) {
      throw new Error("Refusing to remove a path outside the standalone output.");
    }
    await rm(target, { recursive: true });
    removed.push(entry.name);
  }
}

console.log(
  removed.length
    ? `Standalone çıktısından ${removed.length} yerel/runtime dışı öğe çıkarıldı.`
    : "Standalone çıktısında yerel/runtime dışı öğe bulunmadı.",
);
