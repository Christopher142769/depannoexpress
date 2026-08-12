"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/ui/otp-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { OTP_LENGTH, USER_ROLES } from "@/lib/constants";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { LANDING_ROUTES, type AuthRole } from "@/lib/landing-routes";

function parseRole(value: string | null): AuthRole {
  return value === "pro" ? "pro" : "client";
}

function dashboardForRole(role: string) {
  if (role === USER_ROLES.PRO) return LANDING_ROUTES.proApp;
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) return "/admin";
  return LANDING_ROUTES.clientApp;
}

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const role = parseRole(searchParams.get("role"));
  const setUser = useAuthStore((s) => s.setUser);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length < OTP_LENGTH) {
      setError("Code incomplet");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
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
        setError(payload.error ?? "Vérification échouée");
        toast.error(payload.error ?? "Vérification échouée");
        setLoading(false);
        return;
      }
      setUser(payload.user);
      toast.success(
        payload.user.role === USER_ROLES.PRO
          ? "Bienvenue dans l'espace pro !"
          : "Connexion réussie !"
      );
      router.push(dashboardForRole(payload.user.role));
      router.refresh();
    } catch {
      setError("Erreur réseau");
      toast.error("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("E-mail manquant");
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "login", email, role }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(payload.error ?? "Impossible de renvoyer le code");
      } else {
        toast.success("Nouveau code envoyé par e-mail");
      }
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-4 block w-fit">
          <Logo className="mx-auto" />
        </Link>
        <CardTitle>Vérification</CardTitle>
        <CardDescription>
          Code envoyé à{" "}
          <span className="text-text-primary font-medium">{email || "votre e-mail"}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OTPInput value={code} onChange={setCode} error={error} disabled={loading} />
        <Button
          className="w-full"
          onClick={handleVerify}
          loading={loading}
          showArrow
        >
          Vérifier
        </Button>
        <p className="text-center text-sm text-text-secondary">
          Pas reçu ?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-brand-blue hover:underline disabled:opacity-50"
          >
            {resending ? "Envoi…" : "Renvoyer le code"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-secondary">Chargement…</div>}>
      <OTPForm />
    </Suspense>
  );
}
