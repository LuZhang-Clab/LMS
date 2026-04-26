import { NextRequest, NextResponse } from "next/server";

// Edge-compatible auth: no Node.js crypto, uses env vars directly.
// Token must be pre-computed and stored as ADMIN_TOKEN env var.

const FALLBACK_TOKEN = "9feadd4b6c7c6be1177a0408fc5e4d43390d1283da31bb7a2f1b5b43862c5185";

function getAdminToken(): string {
  return process.env.ADMIN_TOKEN ?? FALLBACK_TOKEN;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page through
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Guard all /admin/* routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;
    if (token !== getAdminToken()) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
