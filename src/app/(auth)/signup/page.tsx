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
  name: z.string().min(2, "Nom requis (min. 2 caractères)"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Mot de passe trop court (min. 6 caractères)"),
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (searchParams.get("role") === "pro") {
      router.replace(LANDING_ROUTES.proSignup);
    }
  }, [router, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: "client",
          name: data.name,
          phone: data.phone,
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
        toast.error(payload.error ?? "Impossible de créer le compte");
        return;
      }
      setUser(payload.user);
      toast.success("Compte créé !");
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
        <h1 className="auth-glass-card__title">Créer un compte</h1>
        <p className="auth-glass-card__subtitle">
          Signalez une panne et suivez votre dépanneur en direct.
        </p>
      </AuthCardSection>

      <AuthCardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-fields">
            <AuthUnderlineField
              label="Nom complet"
              autoComplete="name"
              placeholder="Jean Dupont"
              error={errors.name?.message}
              {...register("name")}
            />
            <AuthUnderlineField
              label="Adresse email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.bj"
              error={errors.email?.message}
              {...register("email")}
            />
            <AuthUnderlineField
              label="Téléphone (WhatsApp)"
              type="tel"
              autoComplete="tel"
              placeholder="+229 97 00 00 00"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <AuthUnderlineField
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 caractères"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="auth-actions">
            <AuthButton type="submit" variant="accent" loading={isSubmitting}>
              Créer mon compte
            </AuthButton>
          </div>
        </form>
      </AuthCardSection>

      <AuthCardSection>
        <p className="auth-muted">
          Déjà un compte ?{" "}
          <Link href={LANDING_ROUTES.clientLogin} className="auth-link">
            Se connecter
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

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
