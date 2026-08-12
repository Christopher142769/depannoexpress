import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/server/auth/session-token";
import { USER_ROLES, type UserRole } from "@/lib/constants";

const PROTECTED: { prefix: string; roles: UserRole[]; loginRole: string }[] = [
  {
    prefix: "/app",
    roles: [USER_ROLES.CLIENT],
    loginRole: "client",
  },
  {
    prefix: "/pro",
    roles: [USER_ROLES.PRO],
    loginRole: "pro",
  },
  {
    prefix: "/admin",
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    loginRole: "client",
  },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let session = null;
  try {
    session = token ? await verifySessionToken(token) : null;
  } catch {
    session = null;
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", rule.loginRole);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", rule.loginRole);
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/pro/:path*", "/admin/:path*"],
};
