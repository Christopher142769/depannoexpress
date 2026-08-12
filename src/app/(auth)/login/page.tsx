"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { toast } from "@/components/ui/toast";
import { type AuthRole } from "@/lib/landing-routes";

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

type FormData = z.infer<typeof schema>;

function parseRole(value: string | null): AuthRole {
  return value === "pro" ? "pro" : "client";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = parseRole(searchParams.get("role"));
  const isPro = role === "pro";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "login",
          email: data.email,
          role,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(payload.error ?? "Impossible d'envoyer le code");
        return;
      }
      toast.success("Code envoyé par e-mail");
      const params = new URLSearchParams({
        email: data.email,
        role,
      });
      router.push(`/otp?${params.toString()}`);
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-4 block w-fit">
          <Logo className="mx-auto" />
        </Link>
        <CardTitle>{isPro ? "Connexion dépanneur" : "Connexion conducteur"}</CardTitle>
        <CardDescription>
          Entrez votre e-mail — code de vérification envoyé par e-mail uniquement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting} showArrow>
            Recevoir le code
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Pas encore de compte ?{" "}
          <Link href={`/signup?role=${role}`} className="text-brand-blue hover:underline">
            S&apos;inscrire
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-text-secondary">
          {isPro ? (
            <Link href="/login?role=client" className="text-brand-blue hover:underline">
              Je suis conducteur
            </Link>
          ) : (
            <Link href="/login?role=pro" className="text-brand-blue hover:underline">
              Je suis dépanneur
            </Link>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-secondary">Chargement…</div>}>
      <LoginForm />
    </Suspense>
  );
}
