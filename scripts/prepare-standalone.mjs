import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = join(projectRoot, ".next", "standalone");

await cp(join(projectRoot, ".next", "static"), join(standaloneRoot, ".next", "static"), {
  recursive: true,
  force: true,
});

const publicSource = join(projectRoot, "public");
const publicTarget = join(standaloneRoot, "public");
await mkdir(publicTarget, { recursive: true });

for (const entry of await readdir(publicSource, { withFileTypes: true })) {
  // Kullanıcı yüklemeleri release paketine gömülmez; production'da kalıcı UPLOAD_DIR kullanılır.
  if (entry.name === "uploads") continue;
  await cp(join(publicSource, entry.name), join(publicTarget, entry.name), {
    recursive: true,
    force: true,
  });
}

console.log("Standalone statik dosyaları hazırlandı; public/uploads pakete alınmadı.");
