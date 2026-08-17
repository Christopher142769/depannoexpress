"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/modal";
import { ImageUploader } from "@/components/admin/image-uploader";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { formatFCFA } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  vendor?: { id: string; name: string } | null;
  createdAt: string;
};

const CATEGORIES = [
  { value: "pneu", label: "Pneus" },
  { value: "piece", label: "Pièces" },
  { value: "accessoire", label: "Accessoires" },
];

const CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "pneu",
  price: "",
  stock: "",
  imageUrl: "",
};

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (showInactive) params.set("all", "1");
    if (catFilter) params.set("category", catFilter);
    if (search) params.set("q", search);
    const res = await apiFetch<{ products: Product[] }>(
      `/api/admin/products?${params.toString()}`
    );
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setProducts(res.data.products);
  };

  useEffect(() => {
    void load();
  }, [showInactive, catFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl ?? "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Nom et description requis");
      return;
    }
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (isNaN(price) || price < 0) {
      toast.error("Prix invalide");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error("Stock invalide");
      return;
    }

    setSaving(true);
    if (editing) {
      const res = await apiFetch("/api/admin/products", {
        method: "PATCH",
        body: JSON.stringify({
          id: editing.id,
          name: form.name,
          description: form.description,
          category: form.category,
          price,
          stock,
          imageUrl: form.imageUrl || null,
        }),
      });
      setSaving(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Article modifié");
    } else {
      const res = await apiFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          price,
          stock,
          imageUrl: form.imageUrl || undefined,
        }),
      });
      setSaving(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Article créé");
    }
    setModalOpen(false);
    await load();
  };

  const deactivate = async (p: Product) => {
    if (!confirm(`Désactiver « ${p.name} » ?`)) return;
    const res = await apiFetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Article désactivé");
    await load();
  };

  const toggleActive = async (p: Product) => {
    const res = await apiFetch("/api/admin/products", {
      method: "PATCH",
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight">Boutique</p>
          <p className="text-sm text-text-secondary mt-1">
            Gérez les articles de la boutique client.
          </p>
        </div>
        <Modal open={modalOpen} onOpenChange={setModalOpen}>
          <ModalTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Nouvel article
            </Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{editing ? "Modifier l'article" : "Nouvel article"}</ModalTitle>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <ImageUploader
                bucket="products"
                currentUrl={form.imageUrl}
                onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              />
              <div className="space-y-1">
                <Label>Nom</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Pneu tourisme 185/65 R15"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <textarea
                  className="w-full h-24 rounded-input border border-border bg-bg-surface px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description de l'article…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Catégorie</Label>
                  <select
                    className="w-full h-10 rounded-input border border-border bg-bg-surface px-3 text-sm"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Prix (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={save} loading={saving}>
                  {editing ? "Modifier" : "Créer"}
                </Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <select
          className="h-10 rounded-input border border-border bg-bg-surface px-3 text-sm"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Inactifs
        </label>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-text-secondary">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Aucun article.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-bg-elevated flex items-center justify-center">
                  <Package className="h-10 w-10 text-text-secondary/30" />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-tight">{p.name}</h3>
                  <Badge variant={p.isActive ? "success" : "outline"}>
                    {p.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-brand-blue">
                    {formatFCFA(p.price)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    Stock : {p.stock}
                  </span>
                </div>
                <Badge variant="brand" className="text-xs">
                  {CATEGORY_MAP[p.category] ?? p.category}
                </Badge>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                    {p.isActive ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
