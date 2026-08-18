/**
 * Paylaşım kartına özel biçimlendirme.
 *
 * NEDEN AYRI: Geist fontunda ₺ (U+20BA) GLİFİ YOK — üç ağırlık da tarandı,
 * $ ve € var, ₺ yok. Kartta ₺ kullanılırsa satori eksik glif için canlı
 * fonts.googleapis.com isteği atıyor, alamıyor, karakteri düşürüyor ve render
 * belirgin biçimde yavaşlıyor. Bu yüzden kartta TL yazıyoruz.
 *
 * Sitedeki normal `formatPrice` (lib/format.ts) ₺ kullanmaya devam eder; orada
 * tarayıcının kendi fontu devrede ve sorun yok.
 */

const SYMBOLS: Record<string, string> = { USD: "$", EUR: "€" };

/** Sunucu ve istemcide aynı çıktı — Intl'e bağlı fark oluşmasın. */
function groupThousands(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPriceForCard(price: number, currency = "TRY"): string {
  const amount = groupThousands(price);
  const symbol = SYMBOLS[currency];
  // TRY'de sembol yerine kısaltma: fontta ₺ yok.
  return symbol ? `${symbol}${amount}` : `${amount} ${currency === "TRY" ? "TL" : currency}`;
}
