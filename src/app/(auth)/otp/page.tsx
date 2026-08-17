"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthCardSection } from "@/components/auth/auth-form-chrome";
import { LANDING_ROUTES } from "@/lib/landing-routes";

function OtpRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  useEffect(() => {
    if (role === "pro") {
      router.replace(LANDING_ROUTES.proLogin);
    } else if (role === "admin") {
      router.replace(LANDING_ROUTES.adminLogin);
    } else {
      router.replace(LANDING_ROUTES.clientLogin);
    }
  }, [role, router]);

  return (
    <AuthCardSection>
      <p className="auth-glass-card__eyebrow">Connexion</p>
      <h1 className="auth-glass-card__title">Redirection…</h1>
      <p className="auth-glass-card__subtitle">
        La connexion se fait désormais par email et mot de passe.
      </p>
    </AuthCardSection>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={null}>
      <OtpRedirect />
    </Suspense>
  );
}
