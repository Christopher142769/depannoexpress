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
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

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
          role: "admin",
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
      toast.success("Bienvenue dans le back-office !");
      router.push(dashboardForRole(payload.user.role));
      router.refresh();
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    }
  };

  return (
    <>
      <AuthCardSection>
        <p className="auth-glass-card__eyebrow auth-glass-card__eyebrow--admin">
          Administration
        </p>
        <h1 className="auth-glass-card__title">Connexion admin</h1>
        <p className="auth-glass-card__subtitle">
          Accès réservé au back-office.
        </p>
      </AuthCardSection>

      <AuthCardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-fields">
            <AuthUnderlineField
              label="Adresse email admin"
              type="email"
              autoComplete="email"
              placeholder="admin@depannage-express.bj"
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
          Compte démo ?{" "}
          <Link href={LANDING_ROUTES.demo} className="auth-link">
            Voir la démo
          </Link>
        </p>
      </AuthCardSection>
    </>
  );
}
