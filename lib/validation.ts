import { z } from "zod";

// Türkiye telefon doğrulama — hem sunucu (zod) hem istemci (form) tarafında ortak.
// İzomorfik: "server-only" YOK, client component'lerden de import edilebilir.

/** Rakam dışındaki her şeyi atar. */
export function digitsOnly(input: string): string {
  return (input || "").replace(/\D/g, "");
}

/**
 * TR telefon numarasını 10 haneli ulusal forma indirger (baştaki 0 / +90 / 90 temizlenir).
 * İlk hane TR için 2–5 olmalı (sabit hat 2/3/4, mobil 5). Geçersizse null.
 */
export function normalizeTrPhone(input: string): string | null {
  let d = digitsOnly(input);
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10) return null;
  if (!/^[2-5]/.test(d)) return null;
  return d;
}

/** Geçerli bir TR telefon numarası mı? */
export function isValidTrPhone(input: string): boolean {
  return normalizeTrPhone(input) !== null;
}

/** Saklama/gösterim için biçimli hal: "0XXX XXX XX XX". Geçersizse girdiyi aynen döner. */
export function formatTrPhone(input: string): string {
  const n = normalizeTrPhone(input);
  if (!n) return (input || "").trim();
  return `0${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
}

export const TR_PHONE_ERROR =
  "Geçerli bir Türkiye telefon numarası girin (örn. 0532 123 45 67).";

/** Form şemalarında ortak kullanılan zod telefon alanı (zorunlu). */
export const trPhoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => isValidTrPhone(v), TR_PHONE_ERROR);
