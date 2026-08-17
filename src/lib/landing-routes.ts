/** Routes auth & espaces applicatifs */

export const LANDING_ROUTES = {
  clientApp: "/app",
  clientSignup: "/signup",
  clientLogin: "/login",
  clientProfile: "/app/profil",
  clientBoutique: "/app/boutique",
  proApp: "/pro",
  proSignup: "/pro/signup",
  proLogin: "/pro/login",
  proProfile: "/pro/profil",
  adminApp: "/admin",
  adminLogin: "/admin/login",
  demo: "/demo",
} as const;

/** Rôle pour inscription / login utilisateur & pro */
export type AuthRole = "client" | "pro";

/** Audience auth UI (inclut admin login) */
export type AuthAudience = AuthRole | "admin";

export function authPath(
  type: "login" | "signup",
  role: AuthRole
): string {
  if (role === "pro") {
    return type === "login" ? LANDING_ROUTES.proLogin : LANDING_ROUTES.proSignup;
  }
  return type === "login" ? LANDING_ROUTES.clientLogin : LANDING_ROUTES.clientSignup;
}

export function authAudienceFromPath(pathname: string): AuthAudience {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/pro/") || pathname === "/pro") return "pro";
  return "client";
}

export function dashboardForRole(role: string): string {
  if (role === "pro") return LANDING_ROUTES.proApp;
  if (role === "admin" || role === "super_admin") return LANDING_ROUTES.adminApp;
  return LANDING_ROUTES.clientApp;
}

export { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
