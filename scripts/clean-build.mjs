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

// maxRetries/retryDelay ŞART: bu dizin systemd servisinin çalışma dizini ve
// silme sırasında sunucu süreci hâlâ içinden dosya okuyor. Yarış hâlinde
// fs.rm derin yollarda ENOTEMPTY atıyor (Next 16'nın ".segments/!KHNpdGUp"
// gibi özel karakterli önbellek klasörlerinde görüldü) ve build yarıda
// kalıyor: standalone kısmen silinmiş oluyor, sunucu 200 dönmeye devam ederken
// /_next/static chunk'ları 500 veriyor — yani sayfa çiziliyor ama istemci
// tarafı ölü. Betiğin varlık sebebi zaten tam olarak bu sessiz arızayı
// önlemekti; kendisinin ona yol açmaması gerekiyor.
await rm(target, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
console.log("Önceki standalone çıktısı temizlendi.");
