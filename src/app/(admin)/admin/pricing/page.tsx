"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { formatFCFA } from "@/lib/utils";

type Trade = { id: string; name: string; slug: string };
type PricingRule = {
  id: string;
  trade_id: string;
  base_price: number;
  price_per_km: number;
  trade: Trade | null;
};

export default function AdminPricingPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [form, setForm] = useState<Record<string, { basePrice: string; pricePerKm: string }>>({});

  const load = async () => {
    const [tradesRes, rulesRes] = await Promise.all([
      apiFetch<{ trades: Trade[] }>("/api/admin/trades"),
      apiFetch<{ rules: PricingRule[] }>("/api/admin/pricing"),
    ]);
    if (tradesRes.ok) setTrades(tradesRes.data.trades);
    if (rulesRes.ok) {
      setRules(rulesRes.data.rules);
      const map: Record<string, { basePrice: string; pricePerKm: string }> = {};
      for (const r of rulesRes.data.rules) {
        map[r.trade_id] = {
          basePrice: String(r.base_price),
          pricePerKm: String(r.price_per_km),
        };
      }
      setForm(map);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (tradeId: string) => {
    const f = form[tradeId];
    if (!f) return;
    const basePrice = parseFloat(f.basePrice);
    const pricePerKm = parseFloat(f.pricePerKm || "0");
    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error("Prix de base invalide");
      return;
    }
    const res = await apiFetch("/api/admin/pricing", {
      method: "POST",
      body: JSON.stringify({ tradeId, basePrice, pricePerKm }),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Tarif enregistré");
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xl font-semibold tracking-tight">Tarification</p>
        <p className="text-sm text-text-secondary mt-1">
          Définissez le tarif de base par métier. Le prix final est calculé à partir de la distance.
        </p>
      </div>

      {trades.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-text-secondary">
            Créez d&apos;abord des métiers dans l&apos;onglet &laquo;&nbsp;Métiers&nbsp;&raquo;.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trades.map((t) => {
            const f = form[t.id] ?? { basePrice: "", pricePerKm: "" };
            const existing = rules.find((r) => r.trade_id === t.id);
            return (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label>Prix de base (FCFA)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={f.basePrice}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [t.id]: { ...f, basePrice: e.target.value },
                        }))
                      }
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Prix par km (FCFA)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={f.pricePerKm}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [t.id]: { ...f, pricePerKm: e.target.value },
                        }))
                      }
                      placeholder="500"
                    />
                  </div>
                  {existing && (
                    <p className="text-xs text-text-secondary">
                      Actuel : {formatFCFA(existing.base_price)} + {formatFCFA(existing.price_per_km)}/km
                    </p>
                  )}
                  <Button size="sm" onClick={() => save(t.id)}>
                    <Save className="h-4 w-4 mr-1" />
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
