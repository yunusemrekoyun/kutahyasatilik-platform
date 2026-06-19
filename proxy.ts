import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kutahya-satilik-dev-secret-change-in-production-please"
);

async function hasValidToken(req: NextRequest, cookieName: string, idField: string): Promise<boolean> {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    // Çapraz-silo koruması: hepsi aynı secret ile imzalı; token'ın beklenen silonun
    // id alanını (userId/agentId/adminId) taşıdığını da doğrula (yalnız imza yetmez).
    return typeof payload[idField] === "string" && Boolean(payload[idField]);
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Standart kullanıcı (ks_user) ---
  if (pathname === "/hesabim" || pathname.startsWith("/hesabim/")) {
    if (!(await hasValidToken(req, "ks_user", "userId"))) {
      const url = new URL("/giris", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  if (pathname === "/giris" || pathname === "/kayit") {
    if (await hasValidToken(req, "ks_user", "userId")) {
      return NextResponse.redirect(new URL("/hesabim", req.url));
    }
    return NextResponse.next();
  }

  // --- Emlakçı paneli (ks_agent) ---
  if (pathname.startsWith("/emlakci/panel")) {
    if (!(await hasValidToken(req, "ks_agent", "agentId"))) {
      const url = new URL("/emlakci/giris", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  if (pathname === "/emlakci/giris" || pathname === "/emlakci/kayit") {
    if (await hasValidToken(req, "ks_agent", "agentId")) {
      return NextResponse.redirect(new URL("/emlakci/panel", req.url));
    }
    return NextResponse.next();
  }

  // --- Admin paneli (ks_admin) ---
  if (pathname === "/admin/login") {
    if (await hasValidToken(req, "ks_admin", "adminId")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!(await hasValidToken(req, "ks_admin", "adminId"))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/emlakci/:path*",
    "/hesabim",
    "/hesabim/:path*",
    "/giris",
    "/kayit",
  ],
};
