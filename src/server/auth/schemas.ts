import { z } from "zod";
import { USER_ROLES } from "@/lib/constants";

const authRoleSchema = z.enum([USER_ROLES.CLIENT, USER_ROLES.PRO]);

export const requestOtpSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("login"),
    email: z.string().email(),
    role: authRoleSchema,
  }),
  z.object({
    mode: z.literal("signup"),
    email: z.string().email(),
    role: authRoleSchema,
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

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
