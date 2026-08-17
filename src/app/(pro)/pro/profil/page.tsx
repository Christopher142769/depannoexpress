"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { LANDING_ROUTES } from "@/lib/landing-routes";
import { formatFCFA } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type WalletData = {
  balance: number;
  transactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }[];
};

export default function ProProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [wallet, setWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch<WalletData>("/api/wallet");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setWallet(res.data);
    })();
  }, []);

  return (
    <div className="profile-grid">
      <Card>
        <CardHeader>
          <Badge variant="brand">Profil pro</Badge>
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
          <LogoutButton variant="outline" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Portefeuille</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-display text-3xl font-bold tracking-tight">
              {formatFCFA(wallet?.balance ?? 0)}
            </p>
            <p className="text-sm text-text-secondary">
              Solde disponible après commissions plateforme.
            </p>
            <Button asChild>
              <Link href={LANDING_ROUTES.proApp}>Retour aux missions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernières transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(wallet?.transactions ?? []).slice(0, 6).length === 0 ? (
              <p className="text-sm text-text-secondary">
                Aucune transaction pour le moment.
              </p>
            ) : (
              wallet?.transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-input border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{tx.description || tx.type}</p>
                    <p className="text-xs text-text-secondary">
                      {new Date(tx.createdAt).toLocaleString("fr-BJ")}
                    </p>
                  </div>
                  <p className="font-semibold">{formatFCFA(tx.amount)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
