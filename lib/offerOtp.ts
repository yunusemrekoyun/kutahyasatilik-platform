import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { digitsOnly } from "./validation";

// Teklif görüntüleme için e-posta OTP (rapor §4: e-posta + tel son 4 + 6 haneli kod).

const TTL_MS = 10 * 60 * 1000; // 10 dk
const MAX_ATTEMPTS = 5;

// Başvuruyu e-posta + telefon son-4 ile doğrular (rejected/activated hariç).
export async function findApplicationForOffer(email: string, phone4: string) {
  const app = await prisma.agentApplication.findFirst({
    where: { email: email.toLowerCase().trim(), status: { notIn: ["rejected", "activated"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!app) return null;
  const last4 = digitsOnly(app.phone).slice(-4);
  const given = digitsOnly(phone4).slice(-4);
  if (!last4 || given !== last4) return null;
  return app;
}

// E-posta ile başvuruyu bulur (görüntüleme/kabul adımı; tel tekrar istenmez).
export async function findApplicationByEmail(email: string) {
  return prisma.agentApplication.findFirst({
    where: { email: email.toLowerCase().trim(), status: { notIn: ["rejected", "activated"] } },
    orderBy: { createdAt: "desc" },
  });
}

export async function issueOtp(applicationId: string): Promise<string> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 8);
  await prisma.emailOtp.deleteMany({ where: { applicationId } });
  await prisma.emailOtp.create({
    data: { applicationId, codeHash, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return code;
}

export async function verifyOtp(applicationId: string, code: string): Promise<boolean> {
  const otp = await prisma.emailOtp.findFirst({ where: { applicationId }, orderBy: { createdAt: "desc" } });
  if (!otp) return false;
  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.deleteMany({ where: { applicationId } });
    return false;
  }
  if (otp.attempts >= MAX_ATTEMPTS) return false;
  const ok = await bcrypt.compare((code || "").trim(), otp.codeHash);
  if (!ok) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  return true;
}

// Başvurunun son AKTİF teklifi (yalnız aktif teklif KABUL edilebilir).
export async function activeOfferFor(applicationId: string) {
  return prisma.offer.findFirst({
    where: { applicationId, status: "active" },
    orderBy: { version: "desc" },
  });
}

// Emlakçının GÖRÜNTÜLEYEBİLECEĞİ güncel teklif: son aktif VEYA kabul edilmiş sürüm.
// (activeOfferFor yalnız 'active' döndürdüğünden, kabul sonrası teklif "kaybolup"
// emlakçı kabul ettiği teklifi tekrar göremiyordu — çıkmaz. Bu onu kapsar.)
export async function currentOfferFor(applicationId: string) {
  return prisma.offer.findFirst({
    where: { applicationId, status: { in: ["active", "accepted"] } },
    orderBy: { version: "desc" },
  });
}
