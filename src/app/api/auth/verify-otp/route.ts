import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/db/supabase";
import type { DbUser } from "@/server/db/types";
import { verifyOtpSchema } from "@/server/auth/schemas";
import { normalizeEmail } from "@/server/auth/otp";
import { toAuthUser } from "@/server/auth/guards";
import { applySessionCookie, signSession } from "@/server/auth/session";
import { fromZodError, handleRouteError, jsonError } from "@/server/api/http";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const body = verifyOtpSchema.parse(await req.json());
    const email = normalizeEmail(body.email);

    const supabase = getSupabaseAdmin();

    const { data: otp } = await supabase
      .from("otps")
      .select("id, code, expires_at, attempts")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otp || new Date(otp.expires_at).getTime() < Date.now()) {
      return jsonError(400, "Code expiré ou introuvable. Demandez-en un nouveau.");
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return jsonError(429, "Trop de tentatives. Demandez un nouveau code.");
    }

    if (otp.code !== body.code) {
      const newAttempts = otp.attempts + 1;
      await supabase
        .from("otps")
        .update({ attempts: newAttempts })
        .eq("id", otp.id);

      const remaining = MAX_ATTEMPTS - newAttempts;
      return jsonError(
        400,
        remaining > 0
          ? `Code incorrect. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
          : "Trop de tentatives. Demandez un nouveau code."
      );
    }

    // Delete all OTPs for this email
    await supabase.from("otps").delete().eq("email", email);

    const { data: userDoc } = await supabase
      .from("users")
      .select("id, email, name, role, phone, is_verified")
      .eq("email", email)
      .single();

    if (!userDoc) {
      return jsonError(404, "Utilisateur introuvable");
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
