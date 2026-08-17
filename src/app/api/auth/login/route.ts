import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongodb";
import { User } from "@/server/db/models";
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

    await connectDB();

    const userDoc = await User.findOne({ email }).select("+passwordHash");
    if (!userDoc || !userDoc.passwordHash) {
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

    const ok = await verifyPassword(body.password, userDoc.passwordHash);
    if (!ok) {
      return jsonError(401, "Email ou mot de passe incorrect", undefined, "INVALID_CREDENTIALS");
    }

    if (!userDoc.isVerified) {
      userDoc.isVerified = true;
      await userDoc.save();
    }

    const user = toAuthUser(userDoc);
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
