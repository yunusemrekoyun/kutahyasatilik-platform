import { z } from "zod";

// Sunucu başlarken bir kez çalışır (Next instrumentation hook).
// Zod'un VARSAYILAN hata mesajlarını Türkçeleştirir — şemalarda özel mesaj
// verilmeyen her doğrulama hatası kullanıcıya İngilizce ("Invalid input:
// expected string, received null" gibi) sızmak yerine Türkçe döner.
// Şemalardaki özel Türkçe mesajlar aynen geçerli kalır.
export async function register() {
  z.config(z.locales.tr());
  console.log("[instrumentation] zod TR locale aktif");
}
