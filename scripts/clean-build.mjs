import { rm } from "node:fs/promises";
import path from "node:path";

/**
 * Build öncesi standalone çıktısını temizler.
 *
 * NEDEN: `next build` `.next/standalone/.next/server` altındaki ÖN-RENDER EDİLMİŞ
 * HTML'i her zaman yenilemiyor. Bir önceki build'den kalan `index.html`, artık
 * üretilmeyen chunk adlarına işaret ediyor ve sonuç şu oluyor:
 *   - ana sayfada CSS/JS 404 → stil yok, yatay taşma
 *   - istemci bileşenleri hiç çalışmıyor (çerez diyalogu, favoriler, arama)
 * Sunucu 200 döndüğü ve health check geçtiği için sorun sessiz kalıyor.
 *
 * VPS'te `.next` deploylar arasında kalıcı olduğu için risk orada daha büyük.
 * `.next/static` ve `.next/server` bilerek korunuyor: yalnız standalone kopyası
 * siliniyor, böylece Next'in artımlı derleme önbelleği bozulmuyor.
 */
const target = path.join(process.cwd(), ".next", "standalone");
await rm(target, { recursive: true, force: true });
console.log("Önceki standalone çıktısı temizlendi.");
