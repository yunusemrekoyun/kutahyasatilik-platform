import { unlink } from "fs/promises";
import { resolveUploadPath } from "@/lib/uploads";

// Verilen /uploads/* URL'lerine ait fiziksel dosyaları siler (disk şişmesini önler).
// Yalnızca kendi upload klasörümüzdeki dosyalara dokunur; dış URL'leri yok sayar.
export async function deleteUploadFiles(urls: (string | null | undefined)[]): Promise<void> {
  for (const url of urls) {
    if (!url) continue;
    const match = url.match(/^\/uploads\/(.+)$/);
    if (!match) continue;

    const names = [match[1]];
    if (match[1].endsWith(".webp")) names.push(match[1].replace(/\.webp$/, "-thumb.webp"));

    for (const name of names) {
      const target = resolveUploadPath([name]);
      if (target) await unlink(/*turbopackIgnore: true*/ target).catch(() => {});
    }
  }
}
