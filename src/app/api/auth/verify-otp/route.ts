import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongodb";
import { OTP, User } from "@/server/db/models";
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

    await connectDB();

    const otp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      return jsonError(400, "Code expiré ou introuvable. Demandez-en un nouveau.");
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return jsonError(429, "Trop de tentatives. Demandez un nouveau code.");
    }

    if (otp.code !== body.code) {
      otp.attempts += 1;
      await otp.save();
      const remaining = MAX_ATTEMPTS - otp.attempts;
      return jsonError(
        400,
        remaining > 0
          ? `Code incorrect. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
          : "Trop de tentatives. Demandez un nouveau code."
      );
    }

    await OTP.deleteMany({ email });

    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      return jsonError(404, "Utilisateur introuvable");
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

    const res = NextResponse.json({ user });
    applySessionCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
