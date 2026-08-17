import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/db/supabase";
import type { DbUser } from "@/server/db/types";
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
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? undefined,
  };
}

export async function requireSession(
  req?: NextRequest | Request
): Promise<{ session: SessionPayload; user: AuthUser } | { error: Response }> {
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

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, role, phone")
    .eq("id", session.sub)
    .single();

  if (error || !user) {
    return { error: jsonError(401, "Session invalide", undefined, "INVALID_SESSION") };
  }

  return {
    session,
    user: toAuthUser(user as DbUser),
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
