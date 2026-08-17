import { z } from "zod";
import { USER_ROLES } from "@/lib/constants";

const signupRoleSchema = z.enum([USER_ROLES.CLIENT, USER_ROLES.PRO]);
const loginRoleSchema = z.enum([
  USER_ROLES.CLIENT,
  USER_ROLES.PRO,
  USER_ROLES.ADMIN,
]);

const passwordSchema = z
  .string()
  .min(6, "Mot de passe trop court (min. 6 caractères)")
  .max(128);

export const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Mot de passe requis"),
  role: loginRoleSchema,
});

export const passwordSignupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: signupRoleSchema,
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20).optional(),
});

/** Conservé pour compat éventuelle */
export const requestOtpSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("login"),
    email: z.string().email(),
    role: loginRoleSchema,
  }),
  z.object({
    mode: z.literal("signup"),
    email: z.string().email(),
    role: signupRoleSchema,
    name: z.string().min(2).max(120),
    phone: z.string().min(8).max(20).optional(),
  }),
]);

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres"),
});

export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;
export type PasswordSignupInput = z.infer<typeof passwordSignupSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
