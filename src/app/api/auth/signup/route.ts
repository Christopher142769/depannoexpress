import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/db/supabase";
import type { DbUser } from "@/server/db/types";
import { passwordSignupSchema } from "@/server/auth/schemas";
import { normalizeEmail } from "@/server/auth/otp";
import { hashPassword } from "@/server/auth/password";
import { toAuthUser } from "@/server/auth/guards";
import { applySessionCookie, signSession } from "@/server/auth/session";
import { fromZodError, handleRouteError, jsonError } from "@/server/api/http";
import { pruneRateLimits, takeRateLimit } from "@/server/auth/rate-limit";
import { sanitizeOptional, sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const body = passwordSignupSchema.parse(await req.json());
    const email = normalizeEmail(body.email);

    pruneRateLimits();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const limit = takeRateLimit(`signup:${ip}`, 8, 10 * 60 * 1000);
    if (!limit.ok) {
      return jsonError(
        429,
        `Trop de demandes. Réessayez dans ${limit.retryAfterSec}s.`,
        undefined,
        "RATE_LIMITED"
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return jsonError(409, "Un compte existe déjà avec cet email", undefined, "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(body.password);
    const { data: userDoc, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        name: sanitizeText(body.name, 120),
        phone: sanitizeOptional(body.phone, 20),
        role: body.role,
        password_hash: passwordHash,
        is_verified: true,
      })
      .select("id, email, name, role, phone")
      .single();

    if (insertError || !userDoc) {
      throw new Error(insertError?.message ?? "Erreur insertion utilisateur");
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
