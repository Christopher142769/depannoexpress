import { NextRequest } from "next/server";
import { connectDB } from "@/server/db/mongodb";
import { User } from "@/server/db/models";
import {
  getSessionTokenFromRequest,
  verifySessionToken,
  type SessionPayload,
} from "@/server/auth/session";
import { jsonError } from "@/server/api/http";
import type { UserRole } from "@/lib/constants";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
};

export function toAuthUser(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
}): AuthUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
  };
}

export async function requireSession(
  req?: NextRequest
): Promise<{ session: SessionPayload; user: AuthUser } | { error: Response }> {
  await connectDB();

  let session: SessionPayload | null = null;
  if (req) {
    const token = getSessionTokenFromRequest(req);
    session = token ? await verifySessionToken(token) : null;
  } else {
    const { getSessionFromCookies } = await import("@/server/auth/session");
    session = await getSessionFromCookies();
  }

  if (!session) {
    return { error: jsonError(401, "Non authentifié", undefined, "UNAUTHORIZED") };
  }

  const user = await User.findById(session.sub).lean();
  if (!user) {
    return { error: jsonError(401, "Session invalide", undefined, "INVALID_SESSION") };
  }

  return {
    session,
    user: toAuthUser(user),
  };
}

export function requireRole(
  user: AuthUser,
  allowed: UserRole[]
): Response | null {
  if (!allowed.includes(user.role)) {
    return jsonError(403, "Accès refusé", undefined, "FORBIDDEN");
  }
  return null;
}
