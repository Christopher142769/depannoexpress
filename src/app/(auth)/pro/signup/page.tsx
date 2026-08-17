"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function ProSignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

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
          role: "pro",
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
      toast.success("Compte dépanneur créé !");
      router.push(dashboardForRole(payload.user.role));
      router.refresh();
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    }
  };

  return (
    <>
      <AuthCardSection>
        <p className="auth-glass-card__eyebrow auth-glass-card__eyebrow--pro">
          Espace dépanneur
        </p>
        <h1 className="auth-glass-card__title">Devenir dépanneur</h1>
        <p className="auth-glass-card__subtitle">
          Créez votre compte pour recevoir des missions près de vous.
        </p>
      </AuthCardSection>

      <AuthCardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-fields">
            <AuthUnderlineField
              label="Nom complet / garage"
              autoComplete="name"
              placeholder="Garage Koffi"
              error={errors.name?.message}
              {...register("name")}
            />
            <AuthUnderlineField
              label="Adresse email professionnelle"
              type="email"
              autoComplete="email"
              placeholder="garage@exemple.bj"
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
            <AuthButton
              type="submit"
              variant="accent"
              loading={isSubmitting}
              className="auth-btn--pro"
            >
              Créer mon compte pro
            </AuthButton>
          </div>
        </form>
      </AuthCardSection>

      <AuthCardSection>
        <p className="auth-muted">
          Déjà partenaire ?{" "}
          <Link href={LANDING_ROUTES.proLogin} className="auth-link auth-link--pro">
            Se connecter
          </Link>
        </p>
      </AuthCardSection>
    </>
  );
}
