"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/admin/image-uploader";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

type Trade = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editing, setEditing] = useState<Trade | null>(null);

  const load = async () => {
    const params = showInactive ? "?all=1" : "";
    const res = await apiFetch<{ trades: Trade[] }>(`/api/admin/trades${params}`);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setTrades(res.data.trades);
  };

  useEffect(() => {
    void load();
  }, [showInactive]);

  const reset = () => {
    setName("");
    setSlug("");
    setImageUrl("");
    setEditing(null);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nom requis");
      return;
    }
    if (editing) {
      const body: Record<string, unknown> = { id: editing.id };
      if (name !== editing.name) body.name = name;
      if (slug !== editing.slug) body.slug = slug;
      if (imageUrl !== (editing.image_url ?? "")) body.imageUrl = imageUrl || null;
      const res = await apiFetch("/api/admin/trades", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Métier modifié");
    } else {
      const res = await apiFetch("/api/admin/trades", {
        method: "POST",
        body: JSON.stringify({ name, slug: slug || undefined, imageUrl: imageUrl || undefined }),
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

  const deactivate = async (trade: Trade) => {
    if (!confirm(`Désactiver le métier « ${trade.name} » ?`)) return;
    const res = await apiFetch(`/api/admin/trades?id=${trade.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Métier désactivé");
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
            <div className="flex-1 space-y-1">
              <Label>Nom</Label>
              <Input
                placeholder="Ex. Mécanicien"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editing) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Slug</Label>
              <Input
                placeholder="mecanicien"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>
          <ImageUploader
            bucket="trades"
            currentUrl={imageUrl}
            onUploaded={(url) => setImageUrl(url)}
          />
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
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Liste des métiers</CardTitle>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Inactifs
          </label>
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
                {t.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.image_url} alt={t.name} className="h-6 w-6 rounded object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-text-secondary" />
                )}
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
                    setImageUrl(t.image_url ?? "");
                  }}
                  className="p-1 hover:opacity-70"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deactivate(t)} className="p-1 hover:opacity-70 text-brand-red text-xs">
                  Désactiver
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
