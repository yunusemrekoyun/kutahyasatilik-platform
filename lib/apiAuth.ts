import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Mobil (/api/v1) auth yardımcıları — additive katman.
// Mevcut cookie tabanlı oturum modüllerine (lib/auth, lib/agentAuth, lib/userAuth)
// DOKUNMADAN, aynı AUTH_SECRET ve aynı claim şemasıyla çalışır:
//   - admin token: { adminId, email }              (ks_admin, 7g)
//   - agent token: { agentId, email, name }        (ks_agent, 7g)
//   - user  token: { userId,  email, name }         (ks_user, 30g)
// Mobil istemci token'ı Authorization: Bearer ile taşır; web ise cookie ile.
// Çapraz-silo koruması korunur: bir token yalnız KENDİ silosunun id claim'ini
// taşıdığı role olarak çözülür (bkz. lib/auth.ts açıklaması).

// NOT: secret türetimi lib/auth.ts / lib/agentAuth.ts / lib/userAuth.ts ile AYNI
// olmalıdır (değiştirilirse hepsi birlikte değişmeli) — yoksa token'lar karşılıklı
// doğrulanamaz. Üretimde AUTH_SECRET zorunlu (fail-fast).
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET tanımlı değil. Üretimde .env içinde en az 32 karakterlik rastgele bir AUTH_SECRET zorunludur."
  );
}

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kutahya-satilik-dev-secret-change-in-production-please"
);

export type ApiRole = "user" | "agent" | "admin";

export type ApiSession = {
  role: ApiRole;
  id: string;
  email: string;
  name?: string;
};

// Token üretir (mobil login yanıtı için). Cookie SET ETMEZ — token'ı döndürür.
export async function signSessionToken(
  payload: Record<string, unknown>,
  expiresIn: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// Doğrulanmış JWT payload'ından hangi silonun token'ı olduğunu çözer.
async function sessionFromToken(token: string): Promise<ApiSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.adminId === "string" && payload.adminId) {
      return { role: "admin", id: payload.adminId, email: String(payload.email ?? "") };
    }
    if (typeof payload.agentId === "string" && payload.agentId) {
      return {
        role: "agent",
        id: payload.agentId,
        email: String(payload.email ?? ""),
        name: payload.name ? String(payload.name) : undefined,
      };
    }
    if (typeof payload.userId === "string" && payload.userId) {
      return {
        role: "user",
        id: payload.userId,
        email: String(payload.email ?? ""),
        name: payload.name ? String(payload.name) : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function bearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

// Birleşik oturum çözücü: önce Authorization: Bearer (mobil), yoksa cookie (web).
// Cookie tarafında üç siloyu (ks_user → ks_agent → ks_admin) sırayla dener.
export async function resolveApiSession(req: Request): Promise<ApiSession | null> {
  const bearer = bearerToken(req);
  if (bearer) {
    const fromBearer = await sessionFromToken(bearer);
    if (fromBearer) return fromBearer;
  }

  const jar = await cookies();
  for (const name of ["ks_user", "ks_agent", "ks_admin"] as const) {
    const token = jar.get(name)?.value;
    if (!token) continue;
    const fromCookie = await sessionFromToken(token);
    if (fromCookie) return fromCookie;
  }
  return null;
}
