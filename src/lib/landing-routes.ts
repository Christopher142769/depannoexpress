/** Routes landing — CTA client & dépanneur */

export const LANDING_ROUTES = {
  clientApp: "/app",
  clientSignup: "/signup?role=client",
  clientLogin: "/login?role=client",
  proApp: "/pro",
  proSignup: "/signup?role=pro",
  proLogin: "/login?role=pro",
} as const;

export type AuthRole = "client" | "pro";

export function authPath(
  type: "login" | "signup",
  role: AuthRole
): string {
  return `/${type}?role=${role}`;
}
