"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthCardSection } from "@/components/auth/auth-form-chrome";
import { AuthUnderlineField } from "@/components/auth/auth-underline-field";
import { toast } from "@/components/ui/toast";
import { dashboardForRole, LANDING_ROUTES } from "@/lib/landing-routes";
import { useAuthStore } from "@/stores/auth-store";

const schema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (searchParams.get("role") === "pro") {
      router.replace(LANDING_ROUTES.proLogin);
    }
  }, [router, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: "client",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          role: import("@/lib/constants").UserRole;
          phone?: string;
        };
      };
      if (!res.ok || !payload.user) {
        toast.error(payload.error ?? "Connexion impossible");
        return;
      }
      setUser(payload.user);
      toast.success("Connexion réussie !");
      router.push(dashboardForRole(payload.user.role));
      router.refresh();
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    }
  };

  return (
    <>
      <AuthCardSection>
        <p className="auth-glass-card__eyebrow">Espace utilisateur</p>
        <h1 className="auth-glass-card__title">Connexion</h1>
        <p className="auth-glass-card__subtitle">
          Entrez votre email et votre mot de passe pour accéder à votre espace.
        </p>
      </AuthCardSection>

      <AuthCardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-fields">
            <AuthUnderlineField
              label="Adresse email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.bj"
              error={errors.email?.message}
              {...register("email")}
            />
            <AuthUnderlineField
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="auth-actions">
            <AuthButton type="submit" variant="accent" loading={isSubmitting}>
              Se connecter
            </AuthButton>
          </div>
        </form>
      </AuthCardSection>

      <AuthCardSection>
        <p className="auth-muted">
          Pas encore de compte ?{" "}
          <Link href={LANDING_ROUTES.clientSignup} className="auth-link">
            S&apos;inscrire
          </Link>
          {" · "}
          <Link href={LANDING_ROUTES.demo} className="auth-link">
            Démo
          </Link>
        </p>
      </AuthCardSection>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
