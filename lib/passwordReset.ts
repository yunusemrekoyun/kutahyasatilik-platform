/**
 * Şifre sıfırlama jetonu — kullanıcı ve danışman için ORTAK.
 *
 * Akış iki yerde birebir aynı olduğu için buraya alındı: token üretimi, SHA-256
 * saklama, süre ve tek kullanımlık kontrolü tek yerde. Danışman tarafı eskiden
 * hiç yoktu; şifresini unutan danışman için tek çözüm veritabanına elle
 * müdahaleydi.
 *
 * GÜVENLİK NOTLARI
 * - Jetonun kendisi ASLA saklanmaz, yalnız SHA-256 özeti tutulur; veritabanı
 *   sızsa bile jetonlar kullanılamaz.
 * - Bir hesabın aynı anda tek aktif bağlantısı olur (yeni istek eskisini siler).
 * - Çağıran uç, e-posta kayıtlı olsun olmasın TEK TİP yanıt döndürmelidir
 *   (hesap sayımı/enumeration önlemi).
 */
import crypto from "crypto";
import { prisma } from "./prisma";

export type ResetAudience = "user" | "agent";

/** Bağlantı ömrü. Kısa tutuluyor: e-posta kutusuna erişen biri sonsuza dek kullanamasın. */
export const RESET_TTL_MS = 60 * 60 * 1000;

export const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Yeni jeton üretir, özetini saklar ve HAM jetonu döndürür.
 * Ham değer yalnız e-posta bağlantısına gömülür, hiçbir yere loglanmaz.
 */
export async function issueResetToken(audience: ResetAudience, id: string): Promise<string> {
  const owner = audience === "user" ? { userId: id } : { agentId: id };
  // Tek aktif bağlantı: önceki jetonlar geçersiz olur.
  await prisma.passwordResetToken.deleteMany({ where: owner });

  const token = crypto.randomBytes(32).toString("hex"); // 64 hex karakter
  await prisma.passwordResetToken.create({
    data: { ...owner, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  return token;
}

export type ResolvedResetToken =
  | { ok: true; audience: ResetAudience; id: string }
  | { ok: false };

/**
 * Ham jetonu çözer ve sahibini döndürür.
 *
 * Süresi dolmuş, kullanılmış ya da sahipsiz kayıt geçersiz sayılır. Hangi
 * nedenle geçersiz olduğu çağırana söylenmez — tek tip hata mesajı, saldırgana
 * bilgi vermez.
 */
export async function resolveResetToken(token: string): Promise<ResolvedResetToken> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { userId: true, agentId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return { ok: false };
  if (record.userId) return { ok: true, audience: "user", id: record.userId };
  if (record.agentId) return { ok: true, audience: "agent", id: record.agentId };
  return { ok: false };
}

/**
 * Şifreyi değiştirir ve o hesabın tüm oturumlarını düşürür.
 *
 * `authVersion` artışı mevcut çerezleri geçersiz kılıyor: şifre sıfırlamanın
 * asıl amacı hesabı ele geçirmiş birini dışarı atmak, yalnız yeni şifre
 * yazmak değil. Push kayıtları da pasifleşiyor, yoksa eski cihaz bildirim
 * almaya devam ederdi.
 */
export async function applyNewPassword(
  audience: ResetAudience,
  id: string,
  passwordHash: string,
): Promise<void> {
  const owner = audience === "user" ? { userId: id } : { agentId: id };
  const updateAccount =
    audience === "user"
      ? prisma.user.update({ where: { id }, data: { passwordHash, authVersion: { increment: 1 } } })
      : prisma.agent.update({ where: { id }, data: { passwordHash, authVersion: { increment: 1 } } });

  await prisma.$transaction([
    updateAccount,
    prisma.passwordResetToken.deleteMany({ where: owner }),
    prisma.pushToken.updateMany({
      where: { recipientRole: audience, recipientId: id, active: true },
      data: { active: false },
    }),
  ]);
}
