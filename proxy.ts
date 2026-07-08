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
  if (pathname === "/giris") {
    // Açık-yönlendirme koruması: next yalnız site-içi tek '/' ile başlayan yol olabilir.
    const rawNext = req.nextUrl.searchParams.get("next");
    const next = rawNext && /^\/[^/\\]/.test(rawNext) ? rawNext : null;
    const isAdmin = await hasValidToken(req, "ks_admin", "adminId");
    const isAgent = await hasValidToken(req, "ks_agent", "agentId");
    const isUser = await hasValidToken(req, "ks_user", "userId");
    if (next) {
      // Hedefe erişimi olan oturum varsa oraya gönder; YOKSA login formunu göster —
      // böylece başka rolle girişken de o role (ör. kullanıcıyken admin'e) giriş yapılabilir.
      if (next.startsWith("/admin")) { if (isAdmin) return NextResponse.redirect(new URL(next, req.url)); }
      else if (next.startsWith("/emlakci")) { if (isAgent) return NextResponse.redirect(new URL(next, req.url)); }
      else if (isUser) return NextResponse.redirect(new URL(next, req.url));
      return NextResponse.next();
    }
    // next yok: zaten girişliyse ilgili panele gönder (admin → emlakçı → kullanıcı).
    if (isAdmin) return NextResponse.redirect(new URL("/admin", req.url));
    if (isAgent) return NextResponse.redirect(new URL("/emlakci/panel", req.url));
    if (isUser) return NextResponse.redirect(new URL("/hesabim", req.url));
    return NextResponse.next();
  }
  if (pathname === "/kayit") {
    // Oturumlu her rol uygun panele gider (admin/agent ikinci bir tüketici hesabı açamasın).
    if (await hasValidToken(req, "ks_admin", "adminId")) return NextResponse.redirect(new URL("/admin", req.url));
    if (await hasValidToken(req, "ks_agent", "agentId")) return NextResponse.redirect(new URL("/emlakci/panel", req.url));
    if (await hasValidToken(req, "ks_user", "userId")) return NextResponse.redirect(new URL("/hesabim", req.url));
    return NextResponse.next();
  }

  // --- Emlakçı paneli (ks_agent) ---
  if (pathname.startsWith("/emlakci/panel")) {
    if (!(await hasValidToken(req, "ks_agent", "agentId"))) {
      const url = new URL("/giris", req.url);
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
      const url = new URL("/giris", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
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
