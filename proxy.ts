import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/stores",
  "/products",
  "/orders",
  "/analytics",
  "/price-calculator",
  "/commission-rates",
  "/mavibot",
  "/profile",
  "/subscription",
  "/invite",
  "/settings",
  "/integrations",
  "/api/me",
  "/api/integrations",
  "/api/stores",
  "/api/notifications",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("mavikon_session")?.value);

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
