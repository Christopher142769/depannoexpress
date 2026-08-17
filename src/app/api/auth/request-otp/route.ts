import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { OTP, User } from "@/server/db/models";
import { requestOtpSchema } from "@/server/auth/schemas";
import { generateOtpCode, normalizeEmail } from "@/server/auth/otp";
import { pruneRateLimits, takeRateLimit } from "@/server/auth/rate-limit";
import { sendOTPEmail } from "@/server/services/email-service";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";
import { sanitizeOptional, sanitizeText } from "@/lib/sanitize";

const ROLE_LABEL: Record<string, string> = {
  client: "utilisateur",
  pro: "dépanneur",
  admin: "administrateur",
  super_admin: "super administrateur",
};

export async function POST(req: Request) {
  try {
    const body = requestOtpSchema.parse(await req.json());
    const email = normalizeEmail(body.email);

    pruneRateLimits();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const emailLimit = takeRateLimit(`otp:email:${email}`, 3, 10 * 60 * 1000);
    if (!emailLimit.ok) {
      return jsonError(
        429,
        `Trop de demandes. Réessayez dans ${emailLimit.retryAfterSec}s.`,
        undefined,
        "RATE_LIMITED"
      );
    }

    const ipLimit = takeRateLimit(`otp:ip:${ip}`, 20, 10 * 60 * 1000);
    if (!ipLimit.ok) {
      return jsonError(
        429,
        `Trop de demandes depuis cette adresse. Réessayez dans ${ipLimit.retryAfterSec}s.`,
        undefined,
        "RATE_LIMITED"
      );
    }

    await connectDB();
    const existing = await User.findOne({ email });

    if (body.mode === "login") {
      if (!existing) {
        return jsonError(404, "Aucun compte associé à cet email", undefined, "USER_NOT_FOUND");
      }
      if (existing.role !== body.role) {
        return jsonError(
          403,
          `Ce compte est enregistré en tant que « ${ROLE_LABEL[existing.role] ?? existing.role} », pas « ${ROLE_LABEL[body.role] ?? body.role} »`,
          undefined,
          "ROLE_MISMATCH"
        );
      }
    } else if (existing) {
      if (existing.role !== body.role) {
        return jsonError(
          409,
          `Un compte existe déjà avec un rôle différent (${existing.role})`,
          undefined,
          "ROLE_CONFLICT"
        );
      }
    } else {
      await User.create({
        email,
        name: sanitizeText(body.name, 120),
        phone: sanitizeOptional(body.phone, 20),
        role: body.role,
        isVerified: false,
      });
    }

    await OTP.deleteMany({ email });

    // Le code ne doit JAMAIS apparaître dans la réponse HTTP (même en dev).
    const code = generateOtpCode();
    await OTP.create({
      email,
      code,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
    });

    await sendOTPEmail(email, code);

    return jsonOk({
      ok: true,
      message: "Code envoyé par email",
      email,
      role: body.role,
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
