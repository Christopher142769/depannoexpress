"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { LANDING_ROUTES } from "@/lib/landing-routes";
import { useAuthStore } from "@/stores/auth-store";

export default function ClientProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="profile-grid">
      <Card>
        <CardHeader>
          <Badge variant="brand">Profil</Badge>
          <CardTitle className="mt-2">Vos informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Nom
            </p>
            <p className="font-medium mt-1">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Email
            </p>
            <p className="font-medium mt-1">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Téléphone
            </p>
            <p className="font-medium mt-1">{user?.phone || "Non renseigné"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Espace
            </p>
            <p className="font-medium mt-1">Utilisateur</p>
          </div>
          <LogoutButton variant="outline" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-text-secondary">
            Besoin d’aide sur la route ? Créez une demande depuis l’accueil.
            La boutique liste les pièces utiles en attendant.
          </p>
          <Button asChild>
            <Link href={LANDING_ROUTES.clientApp}>Signaler une panne</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={LANDING_ROUTES.clientBoutique}>Voir la boutique</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
