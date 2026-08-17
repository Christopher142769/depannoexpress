"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

type Trade = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<Trade | null>(null);

  const load = async () => {
    const res = await apiFetch<{ trades: Trade[] }>("/api/admin/trades");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setTrades(res.data.trades);
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setName("");
    setSlug("");
    setEditing(null);
  };

  const save = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Nom et slug requis");
      return;
    }
    if (editing) {
      const res = await apiFetch("/api/admin/trades", {
        method: "PATCH",
        body: JSON.stringify({ id: editing.id, name, slug }),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Métier modifié");
    } else {
      const res = await apiFetch("/api/admin/trades", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Métier ajouté");
    }
    reset();
    await load();
  };

  const toggle = async (trade: Trade) => {
    const res = await apiFetch("/api/admin/trades", {
      method: "PATCH",
      body: JSON.stringify({ id: trade.id, isActive: !trade.is_active }),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce métier ?")) return;
    const res = await apiFetch(`/api/admin/trades?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Supprimé");
    reset();
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xl font-semibold tracking-tight">Métiers</p>
        <p className="text-sm text-text-secondary mt-1">
          Gérez les spécialités proposées aux dépanneurs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Modifier un métier" : "Ajouter un métier"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Nom (ex. Mécanicien)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editing) setSlug(e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
              }}
            />
            <Input
              placeholder="Slug (ex. mecanicien)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>{editing ? "Modifier" : "Ajouter"}</Button>
            {editing && (
              <Button variant="outline" onClick={reset}>
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des métiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trades.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-4">Aucun métier.</p>
          )}
          {trades.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-input border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-text-secondary">{t.slug}</span>
                <Badge variant={t.is_active ? "success" : "outline"}>
                  {t.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(t)} className="p-1 hover:opacity-70">
                  {t.is_active ? (
                    <ToggleRight className="h-5 w-5 text-success" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(t);
                    setName(t.name);
                    setSlug(t.slug);
                  }}
                  className="p-1 hover:opacity-70"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(t.id)} className="p-1 hover:opacity-70">
                  <Trash2 className="h-4 w-4 text-brand-red" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
