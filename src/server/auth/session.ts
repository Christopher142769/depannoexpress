import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
  type SessionPayload,
} from "@/server/auth/session-token";

export {
  SESSION_COOKIE,
  signSession,
  verifySessionToken,
  sessionCookieOptions,
  applySessionCookie,
  clearSessionCookieOnResponse,
  type SessionPayload,
} from "@/server/auth/session-token";

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Cookie (web) ou Authorization: Bearer (app mobile) */
export function getSessionTokenFromRequest(
  req: NextRequest | Request
): string | undefined {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  if ("cookies" in req && typeof req.cookies?.get === "function") {
    return (req as NextRequest).cookies.get(SESSION_COOKIE)?.value;
  }

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}
