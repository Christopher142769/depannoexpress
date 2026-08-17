import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/db/supabase";
import type { DbUser } from "@/server/db/types";
import { passwordLoginSchema } from "@/server/auth/schemas";
import { normalizeEmail } from "@/server/auth/otp";
import { verifyPassword } from "@/server/auth/password";
import { toAuthUser } from "@/server/auth/guards";
import { applySessionCookie, signSession } from "@/server/auth/session";
import { fromZodError, handleRouteError, jsonError } from "@/server/api/http";
import { pruneRateLimits, takeRateLimit } from "@/server/auth/rate-limit";

const ROLE_LABEL: Record<string, string> = {
  client: "utilisateur",
  pro: "dépanneur",
  admin: "administrateur",
  super_admin: "super administrateur",
};

export async function POST(req: Request) {
  try {
    const body = passwordLoginSchema.parse(await req.json());
    const email = normalizeEmail(body.email);

    pruneRateLimits();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const limit = takeRateLimit(`login:${ip}:${email}`, 10, 10 * 60 * 1000);
    if (!limit.ok) {
      return jsonError(
        429,
        `Trop de tentatives. Réessayez dans ${limit.retryAfterSec}s.`,
        undefined,
        "RATE_LIMITED"
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: userDoc } = await supabase
      .from("users")
      .select("id, email, name, role, phone, password_hash, is_verified")
      .eq("email", email)
      .single();

    if (!userDoc || !userDoc.password_hash) {
      return jsonError(401, "Email ou mot de passe incorrect", undefined, "INVALID_CREDENTIALS");
    }

    if (userDoc.role !== body.role) {
      return jsonError(
        403,
        `Ce compte est enregistré en tant que « ${ROLE_LABEL[userDoc.role] ?? userDoc.role} », pas « ${ROLE_LABEL[body.role] ?? body.role} »`,
        undefined,
        "ROLE_MISMATCH"
      );
    }

    const ok = await verifyPassword(body.password, userDoc.password_hash);
    if (!ok) {
      return jsonError(401, "Email ou mot de passe incorrect", undefined, "INVALID_CREDENTIALS");
    }

    if (!userDoc.is_verified) {
      await supabase
        .from("users")
        .update({ is_verified: true })
        .eq("id", userDoc.id);
    }

    const user = toAuthUser(userDoc as DbUser);
    const token = await signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({ user, token });
    applySessionCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
