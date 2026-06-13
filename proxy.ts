import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kutahya-satilik-dev-secret-change-in-production-please"
);

async function hasValidToken(req: NextRequest, cookieName: string): Promise<boolean> {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Emlakçı paneli ---
  if (pathname.startsWith("/emlakci/panel")) {
    const validAgent = await hasValidToken(req, "ks_agent");
    if (!validAgent) {
      const url = new URL("/emlakci/giris", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Giriş yapmış emlakçı giriş/kayıt sayfasına gelirse panele yönlendir
  if (pathname === "/emlakci/giris" || pathname === "/emlakci/kayit") {
    if (await hasValidToken(req, "ks_agent")) {
      return NextResponse.redirect(new URL("/emlakci/panel", req.url));
    }
    return NextResponse.next();
  }

  // --- Admin paneli ---
  const isAdminLogin = pathname === "/admin/login";
  const validAdmin = await hasValidToken(req, "ks_admin");

  if (isAdminLogin) {
    if (validAdmin) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  if (!validAdmin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/emlakci/:path*"],
};
