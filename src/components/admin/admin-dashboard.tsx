"use client";

import { useEffect, useState } from "react";
import { Users, Wrench, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
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

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  en_route: "En route",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const ROLE_LABEL: Record<string, string> = {
  client: "Utilisateur",
  pro: "Dépanneur",
  admin: "Admin",
  super_admin: "Super admin",
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
    <div className="space-y-8">
      <div>
        <p className="font-display text-xl font-semibold tracking-tight">
          Tableau de bord
        </p>
        <p className="text-sm text-text-secondary mt-1">
          Vue d’ensemble des utilisateurs, interventions et revenus plateforme.
        </p>
      </div>
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
              <option value="client">Utilisateurs</option>
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
                      {ROLE_LABEL[u.role] ?? u.role}
                      {u.specialty ? ` · ${u.specialty}` : ""}
                    </td>
                    <td className="py-2">
                      {u.role === "pro"
                        ? u.isAvailable
                          ? "Disponible"
                          : "Hors ligne"
                        : "·"}
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
              <option value="pending">En attente</option>
              <option value="accepted">Acceptée</option>
              <option value="en_route">En route</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
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
                  <Badge variant="brand">
                    {STATUS_LABEL[i.status] ?? i.status}
                  </Badge>
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
    </div>
  );
}
