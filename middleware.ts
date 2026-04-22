import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE_NAME = "gdp_access";

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/api/check-domains");
}

export function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.get(ACCESS_COOKIE_NAME)?.value) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/check-domains")) {
    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/pricing";
  redirectUrl.searchParams.set("from", request.nextUrl.pathname);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/check-domains"]
};
