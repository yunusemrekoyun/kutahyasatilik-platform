import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge runtime'da çalışır; lib/auth & lib/agentAuth "server-only" olduğu için
// burada cookie doğrulamasını jose ile bağımsız yapıyoruz (aynı HS256 secret).
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "kutahya-satilik-dev-secret-change-in-production-please"
);

async function hasValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin paneli: /admin/login hariç tüm /admin yolları oturum ister.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!(await hasValidToken(req.cookies.get("ks_admin")?.value))) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Emlakçı paneli: oturum yoksa girişe yönlendir.
  if (pathname === "/emlakci/panel" || pathname.startsWith("/emlakci/panel/")) {
    if (!(await hasValidToken(req.cookies.get("ks_agent")?.value))) {
      const url = req.nextUrl.clone();
      url.pathname = "/emlakci/giris";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/emlakci/panel", "/emlakci/panel/:path*"],
};
