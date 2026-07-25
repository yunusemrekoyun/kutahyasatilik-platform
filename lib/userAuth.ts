import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authSecret } from "./authSecret";

// Standart kullanıcı oturumu — admin (ks_admin) ve emlakçı (ks_agent) oturumlarından
// AYRI bir cookie kullanır. Aynı AUTH_SECRET ile imzalanır.
const COOKIE_NAME = "ks_user";

export type UserSession = { userId: string; email: string; name: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createUserSession(payload: UserSession) {
  const authVersion = (await prisma.user.findUnique({ where: { id: payload.userId }, select: { authVersion: true } }))?.authVersion ?? 0;
  const token = await new SignJWT({ ...payload, ver: authVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret);
    // Çapraz-silo koruması (bkz. lib/auth.ts): userId yoksa kabul etme.
    if (typeof payload.userId !== "string" || !payload.userId) return null;
    const tokenVersion = typeof payload.ver === "number" ? payload.ver : 0;
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true, name: true, authVersion: true } });
    if (!user || user.authVersion !== tokenVersion) return null;
    return {
      userId: payload.userId,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}
