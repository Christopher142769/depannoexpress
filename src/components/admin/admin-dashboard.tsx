"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Wrench, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { LogoutButton } from "@/components/auth/logout-button";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { formatFCFA } from "@/lib/utils";

type Stats = {
  interventionsByStatus: Record<string, number>;
  activePros: number;
  clients: number;
  platformRevenue: number;
  totalInterventions: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty?: string;
  isAvailable?: boolean;
};

type InterventionRow = {
  id: string;
  status: string;
  problem: string;
  client?: { name?: string } | null;
  pro?: { name?: string } | null;
  createdAt: string;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await apiFetch<Stats>("/api/admin/stats");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setStats(res.data);
    })();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    void (async () => {
      const res = await apiFetch<{ users: UserRow[] }>(
        `/api/admin/users?${params.toString()}`
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setUsers(res.data.users);
    })();
  }, [roleFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    void (async () => {
      const res = await apiFetch<{ interventions: InterventionRow[] }>(
        `/api/admin/interventions?${params.toString()}`
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setInterventions(res.data.interventions);
    })();
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-bg-base pb-16">
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <Badge variant="warning">Administration</Badge>
            <p className="font-display font-semibold mt-1">Back-office</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Accueil</Link>
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Interventions"
            value={stats?.totalInterventions ?? 0}
            icon={Wrench}
          />
          <StatCard
            label="Dépanneurs actifs"
            value={stats?.activePros ?? 0}
            icon={Users}
          />
          <StatCard label="Clients" value={stats?.clients ?? 0} icon={Users} />
          <StatCard
            label="Revenus plateforme"
            value={stats?.platformRevenue ?? 0}
            suffix=" F"
            icon={Wallet}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Utilisateurs</CardTitle>
            <select
              className="h-10 rounded-input border border-border bg-bg-surface px-3 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tous les rôles</option>
              <option value="client">Clients</option>
              <option value="pro">Dépanneurs</option>
              <option value="admin">Admins</option>
            </select>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border">
                  <th className="py-2 pr-3">Nom</th>
                  <th className="py-2 pr-3">E-mail</th>
                  <th className="py-2 pr-3">Rôle</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium">{u.name}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">
                      {u.role}
                      {u.specialty ? ` · ${u.specialty}` : ""}
                    </td>
                    <td className="py-2">
                      {u.role === "pro"
                        ? u.isAvailable
                          ? "Disponible"
                          : "Hors ligne"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-text-secondary py-6 text-center">Aucun utilisateur.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Interventions</CardTitle>
            <select
              className="h-10 rounded-input border border-border bg-bg-surface px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">pending</option>
              <option value="accepted">accepted</option>
              <option value="en_route">en_route</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-2">
            {interventions.length === 0 ? (
              <p className="text-text-secondary text-center py-6">
                Aucune intervention.
              </p>
            ) : (
              interventions.map((i) => (
                <div
                  key={i.id}
                  className="rounded-input border border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">{i.problem}</p>
                    <p className="text-xs text-text-secondary">
                      {i.client?.name ?? "Client"}
                      {i.pro?.name ? ` → ${i.pro.name}` : ""}
                      {" · "}
                      {new Date(i.createdAt).toLocaleString("fr-BJ")}
                    </p>
                  </div>
                  <Badge variant="brand">{i.status}</Badge>
                </div>
              ))
            )}
            {stats && (
              <p className="text-xs text-text-secondary pt-2">
                Commissions cumulées : {formatFCFA(stats.platformRevenue)}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
