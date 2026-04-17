import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "gdp_access";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/check-domains")) {
    return NextResponse.json({ error: "Paid access required." }, { status: 401 });
  }

  const landingUrl = new URL("/", request.url);
  return NextResponse.redirect(landingUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/check-domains/:path*"]
};
