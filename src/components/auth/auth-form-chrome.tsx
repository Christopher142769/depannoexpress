"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuthBrandHeader } from "@/components/auth/auth-visual-panel";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  authAudienceFromPath,
  LANDING_ROUTES,
  type AuthAudience,
} from "@/lib/landing-routes";
import { cn } from "@/lib/utils";

export function AuthFormChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const audience: AuthAudience =
    roleParam === "pro"
      ? "pro"
      : roleParam === "admin"
        ? "admin"
        : authAudienceFromPath(pathname);

  const isPro = audience === "pro";
  const isAdmin = audience === "admin";
  const isOtp = pathname === "/otp";
  const isLogin =
    pathname === "/login" ||
    pathname === "/pro/login" ||
    pathname === "/admin/login";
  const isSignup =
    pathname === "/signup" || pathname === "/pro/signup";

  const signupHref = isPro ? LANDING_ROUTES.proSignup : LANDING_ROUTES.clientSignup;
  const loginHref = isPro
    ? LANDING_ROUTES.proLogin
    : isAdmin
      ? LANDING_ROUTES.adminLogin
      : LANDING_ROUTES.clientLogin;

  return (
    <div
      className={cn(
        "auth-form-column",
        isPro && "auth-form-column--pro",
        isAdmin && "auth-form-column--admin",
      )}
    >
      <header className="auth-form-header">
        <AuthBrandHeader />
      </header>

      <div className="auth-form-body">
        <motion.div
          className={cn(
            "auth-glass-card",
            isPro && "auth-glass-card--pro",
            isAdmin && "auth-glass-card--admin",
          )}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {children}
        </motion.div>
      </div>

      {!isOtp ? (
        <footer className="auth-form-footer">
          {!isAdmin ? (
            <nav className="auth-nav-tabs" aria-label="Navigation authentification">
              <Link
                href={signupHref}
                className={cn(
                  "auth-nav-tab",
                  isSignup && "is-active",
                  isPro && "auth-nav-tab--pro",
                )}
              >
                Inscription
                {isSignup ? (
                  <motion.span
                    className="auth-nav-tab__indicator"
                    layoutId="auth-tab-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </Link>
              <Link
                href={loginHref}
                className={cn(
                  "auth-nav-tab",
                  isLogin && "is-active",
                  isPro && "auth-nav-tab--pro",
                )}
              >
                Connexion
                {isLogin ? (
                  <motion.span
                    className="auth-nav-tab__indicator"
                    layoutId="auth-tab-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </Link>
            </nav>
          ) : (
            <nav className="auth-nav-tabs" aria-label="Navigation authentification">
              <span className={cn("auth-nav-tab", "is-active", "auth-nav-tab--admin")}>
                Connexion admin
                <motion.span
                  className="auth-nav-tab__indicator"
                  layoutId="auth-tab-indicator"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              </span>
            </nav>
          )}

          <p className="auth-crosslink">
            {isAdmin ? (
              <>
                Accès public ?{" "}
                <Link href={LANDING_ROUTES.demo} className="auth-link">
                  Comptes démo
                </Link>
                {" · "}
                <Link href={LANDING_ROUTES.clientLogin} className="auth-link">
                  Utilisateur
                </Link>
              </>
            ) : isPro ? (
              <>
                Vous êtes utilisateur ?{" "}
                <Link href={LANDING_ROUTES.clientLogin} className="auth-link">
                  Espace utilisateur
                </Link>
              </>
            ) : (
              <>
                Vous êtes dépanneur ?{" "}
                <Link href={LANDING_ROUTES.proLogin} className="auth-link auth-link--pro">
                  Espace pro
                </Link>
              </>
            )}
          </p>
        </footer>
      ) : null}
    </div>
  );
}

export function AuthCardSection({ children }: { children: React.ReactNode }) {
  return <motion.div variants={staggerItem}>{children}</motion.div>;
}
