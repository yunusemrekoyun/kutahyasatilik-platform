import "server-only";
import * as Sentry from "@sentry/nextjs";

/**
 * Kademeli bozulma (graceful degradation) yapan uçlar için ortak raporlama.
 *
 * Beş uç hatayı `{ ok: true, items: [] }` ile yutuyordu. Bu iki şeyi birden
 * bozuyordu:
 *  1. Üretimde kök neden hiçbir yere düşmüyordu (Sentry 119 handler'ın yalnız
 *     2'sinde vardı).
 *  2. İstemci "veri yok" ile "sistem bozuk" ayrımını yapamıyordu — kullanıcı
 *     boş liste görüp ilan kalmadığını sanıyordu.
 *
 * Sözleşmeyi kırmamak için boş liste dönmeye devam ediyoruz (eski mobil
 * sürümler `ok:false` beklemiyor), ama hata raporlanıyor ve yanıta `degraded`
 * ekleniyor; yeni istemciler bunu ayırt edebiliyor.
 *
 * Sentry DSN yoksa `captureException` sessizce no-op olur — kurulum zorunlu değil.
 */
export function reportApiError(scope: string, error: unknown): void {
  try {
    Sentry.captureException(error, { tags: { scope } });
  } catch {
    /* raporlama hatası isteği düşürmesin */
  }
  // Sentry kapalıyken de bir iz kalsın: journalctl/systemd loglarında görünür.
  console.error(`[api:${scope}]`, error instanceof Error ? error.message : error);
}
