import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessCookie = Boolean(request.cookies.get(ACCESS_COOKIE_NAME)?.value);

  if (!hasAccessCookie && pathname.startsWith("/dashboard")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("paywall", "1");
    return NextResponse.redirect(redirectUrl);
  }

  if (!hasAccessCookie && pathname === "/api/domain-check") {
    return NextResponse.json(
      {
        error: "Payment required. Unlock access from the landing page first.",
      },
      { status: 402 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/domain-check"],
};
