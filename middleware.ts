import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login は認証不要
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // /admin/* の保護
  if (pathname.startsWith("/admin")) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get("admin_auth")?.value;

    // ADMIN_PASSWORD 未設定の場合は開発モードとして通過
    if (!adminPassword) {
      return NextResponse.next();
    }

    // Cookie チェック
    if (cookie !== adminPassword) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
