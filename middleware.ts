import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add paths that should be protected (require no auth)
const publicPaths = ["/auth/login", "/auth/signup", "/"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("refreshToken")?.value || "";
  const { pathname } = request.nextUrl;

  if (token && publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    !token &&
    !publicPaths.includes(pathname) &&
    !pathname.startsWith("/auth/")
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
