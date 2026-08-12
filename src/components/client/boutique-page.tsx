"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/components/auth/logout-button";
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
  imageUrl?: string;
};

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "pneu", label: "Pneus" },
  { value: "piece", label: "Pièces" },
  { value: "accessoire", label: "Accessoires" },
];

export function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    void (async () => {
      const res = await apiFetch<{ products: Product[] }>(
        `/api/products?${params.toString()}`
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setProducts(res.data.products);
    })();
  }, [category, q]);

  return (
    <div className="min-h-screen bg-bg-base pb-20 md:pb-16">
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <Badge variant="brand">Boutique</Badge>
            <p className="font-display font-semibold mt-1">Pièces et accessoires</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/app">Retour</Link>
            </Button>
            <LogoutButton variant="ghost" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c.value || "all"}
                size="sm"
                variant={category === c.value ? "primary" : "ghost"}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-text-secondary">
              Aucun produit pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                {p.imageUrl ? (
                  <div className="relative aspect-square bg-bg-deep">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : null}
                <CardHeader>
                  <Badge variant="outline">{p.category}</Badge>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-text-secondary line-clamp-3">{p.description}</p>
                  <p className="font-display text-xl font-bold">{formatFCFA(p.price)}</p>
                  <p className="text-xs text-text-secondary">Stock : {p.stock}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
