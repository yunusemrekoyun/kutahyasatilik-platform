import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Emlakçı (danışman) oturumu — admin oturumundan (ks_admin) ayrı bir cookie kullanır.
const COOKIE_NAME = "ks_agent";

// Üretimde AUTH_SECRET zorunludur — yoksa oturum imzaları herkese açık fallback
// secret ile üretilir ve forge edilebilir. Boot etmeyi reddet (fail-fast).
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET tanımlı değil. Üretimde .env içinde en az 32 karakterlik rastgele bir AUTH_SECRET zorunludur."
  );
}

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kutahya-satilik-dev-secret-change-in-production-please"
);

export type AgentSession = { agentId: string; email: string; name: string };

export async function verifyAgentCredentials(email: string, password: string) {
  const agent = await prisma.agent.findUnique({ where: { email: email.toLowerCase() } });
  if (!agent) return null;
  const ok = await bcrypt.compare(password, agent.passwordHash);
  if (!ok) return null;
  return agent;
}

export async function createAgentSession(payload: AgentSession) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroyAgentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAgentSession(): Promise<AgentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    // Çapraz-silo koruması (bkz. lib/auth.ts): agentId yoksa kabul etme.
    if (typeof payload.agentId !== "string" || !payload.agentId) return null;
    return {
      agentId: payload.agentId,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Oturumdaki emlakçı ONAYLI mı? (throw etmez; upload gibi route'larda kullanılır —
// askıya alınmış/onaysız emlakçının lingering cookie'si işlem tetikleyemesin.)
export async function isApprovedAgentSession(): Promise<boolean> {
  const session = await getAgentSession();
  if (!session) return false;
  const agent = await prisma.agent.findUnique({ where: { id: session.agentId }, select: { status: true } });
  return agent?.status === "approved";
}

// Panel sunucu aksiyonları için: oturum + onaylı emlakçı şartı.
export async function requireApprovedAgent() {
  const session = await getAgentSession();
  if (!session) throw new Error("Yetkisiz");
  const agent = await prisma.agent.findUnique({ where: { id: session.agentId } });
  if (!agent || agent.status !== "approved") throw new Error("Hesabınız onaylı değil");
  return agent;
}
