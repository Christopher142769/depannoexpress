"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/ui/otp-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, OTP_LENGTH } from "@/lib/constants";
import { toast } from "@/components/ui/toast";

import { LANDING_ROUTES, type AuthRole } from "@/lib/landing-routes";

function parseRole(value: string | null): AuthRole {
  return value === "pro" ? "pro" : "client";
}

function OTPForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const role = parseRole(searchParams.get("role"));
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length < OTP_LENGTH) {
      setError("Code incomplet");
      return;
    }
    setLoading(true);
    setError("");
    // TODO: vérifier OTP via API
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success(role === "pro" ? "Bienvenue dans l'espace pro !" : "Connexion réussie !");
    window.location.href = role === "pro" ? LANDING_ROUTES.proApp : LANDING_ROUTES.clientApp;
  };

  const handleResend = async () => {
    toast.info("Nouveau code envoyé par e-mail");
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-4 block">
          <img src="/logo.svg" alt={APP_NAME} width={120} height={30} className="mx-auto h-8 w-auto" />
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
            className="text-brand-blue hover:underline"
          >
            Renvoyer le code
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
