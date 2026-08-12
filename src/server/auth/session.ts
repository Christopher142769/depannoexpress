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

export function getSessionTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}
