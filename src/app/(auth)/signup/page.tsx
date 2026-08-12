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
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/components/ui/toast";
import { type AuthRole } from "@/lib/landing-routes";

const schema = z.object({
  name: z.string().min(2, "Nom requis (min. 2 caractères)"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
});

type FormData = z.infer<typeof schema>;

function parseRole(value: string | null): AuthRole {
  return value === "pro" ? "pro" : "client";
}

function SignupForm() {
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
          mode: "signup",
          email: data.email,
          role,
          name: data.name,
          phone: data.phone,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(payload.error ?? "Impossible de créer le compte");
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
        <CardTitle>{isPro ? "Devenir dépanneur" : "Inscription conducteur"}</CardTitle>
        <CardDescription>
          Rejoignez {APP_NAME} — vérification par e-mail uniquement (jamais par SMS).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{isPro ? "Nom / raison sociale" : "Nom complet"}</Label>
            <Input id="name" placeholder={isPro ? "Garage Koffi" : "Jean Dupont"} error={errors.name?.message} {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input id="email" type="email" placeholder="vous@exemple.com" error={errors.email?.message} {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (WhatsApp)</Label>
            <Input id="phone" type="tel" placeholder="+229 97 00 00 00" error={errors.phone?.message} {...register("phone")} />
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting} showArrow>
            Continuer
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Déjà inscrit ?{" "}
          <Link href={`/login?role=${role}`} className="text-brand-blue hover:underline">
            Se connecter
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-text-secondary">
          {isPro ? (
            <Link href="/signup?role=client" className="text-brand-blue hover:underline">
              Je suis conducteur
            </Link>
          ) : (
            <Link href="/signup?role=pro" className="text-brand-blue hover:underline">
              Je suis dépanneur
            </Link>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-secondary">Chargement…</div>}>
      <SignupForm />
    </Suspense>
  );
}
