"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigation, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ClientLiveMap } from "@/components/maps/client-live-map";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { formatFCFA } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { PRO_SPECIALTIES } from "@/lib/constants";
import {
  publishRealtimeEvent,
  useInterventionRealtime,
} from "@/hooks/use-intervention-realtime";
import type { RealtimeEvent } from "@/lib/realtime/realtime-service";
import { Input } from "@/components/ui/input";

type Mission = {
  id: string;
  status: string;
  problem: string;
  clientLocation: { lat: number; lng: number; address?: string } | null;
  client?: { name?: string; phone?: string } | null;
  estimatedPrice?: number;
  finalPrice?: number;
};

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

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  en_route: "En route",
  in_progress: "En cours",
  completed: "Terminée",
};

export function ProDashboard() {
  const user = useAuthStore((s) => s.user);
  const [available, setAvailable] = useState(false);
  const [specialty, setSpecialty] = useState<string>(PRO_SPECIALTIES.MECHANIC);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [active, setActive] = useState<Mission | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState<{ senderId: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const loadMissions = useCallback(async () => {
    const res = await apiFetch<{
      missions: Mission[];
      active: Mission | null;
      available: boolean;
      location?: { lat: number; lng: number };
    }>("/api/pro/missions");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setMissions(res.data.missions);
    setActive(res.data.active);
    setAvailable(res.data.available);
    if (res.data.location) setCoords(res.data.location);
  }, []);

  const loadWallet = useCallback(async () => {
    const res = await apiFetch<WalletData>("/api/wallet");
    if (res.ok) setWallet(res.data);
  }, []);

  const onRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      if (event.type === "status_change") {
        void loadMissions();
        if (event.status === "completed") void loadWallet();
        return;
      }
      if (event.type === "chat_message") {
        setChat((prev) => [
          ...prev,
          { senderId: event.senderId, content: event.content },
        ]);
      }
    },
    [loadMissions, loadWallet]
  );

  const { connected: realtimeConnected } = useInterventionRealtime({
    interventionId: active?.id,
    enabled: !!active,
    onEvent: onRealtimeEvent,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setChat([]), 0);
    return () => window.clearTimeout(t);
  }, [active?.id]);

  useEffect(() => {
    let cancelled = false;
    const tick = window.setTimeout(() => {
      if (cancelled) return;
      void loadMissions();
      void loadWallet();
    }, 0);
    const intervalMs = realtimeConnected ? 30000 : 8000;
    const t = window.setInterval(() => {
      if (!cancelled) void loadMissions();
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearTimeout(tick);
      window.clearInterval(t);
    };
  }, [loadMissions, loadWallet, realtimeConnected]);

  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    let lastSent = 0;
    const id = navigator.geolocation.watchPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      const now = Date.now();
      if (now - lastSent < 4000) return;
      lastSent = now;
      await apiFetch(`/api/interventions/${active.id}`, {
        method: "PATCH",
        body: JSON.stringify({ proLat: lat, proLng: lng }),
      });
      await publishRealtimeEvent({
        type: "location_update",
        interventionId: active.id,
        lat,
        lng,
      });
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);

  const locateAndToggle = async (next: boolean) => {
    setBusy(true);
    let lat = coords?.lat;
    let lng = coords?.lng;
    if (next && (lat === undefined || lng === undefined)) {
      const pos = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
          enableHighAccuracy: true,
          timeout: 12000,
        });
      });
      if (!pos) {
        setBusy(false);
        toast.error("Localisation requise");
        return;
      }
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      setCoords({ lat, lng });
    }

    const res = await apiFetch("/api/pro/availability", {
      method: "PATCH",
      body: JSON.stringify({
        isAvailable: next,
        lat,
        lng,
        specialty,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAvailable(next);
    toast.success(next ? "Vous êtes disponible" : "Vous êtes hors ligne");
    await loadMissions();
  };

  const accept = async (id: string) => {
    const res = await apiFetch<{ intervention: Mission }>(`/api/pro/missions/${id}/accept`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Mission acceptée");
    setAvailable(false);
    await loadMissions();
  };

  const advance = async (status: string, finalPrice?: number) => {
    if (!active) return;
    const res = await apiFetch(`/api/interventions/${active.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, finalPrice }),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Statut : ${STATUS_LABEL[status] ?? status}`);
    await loadMissions();
    await loadWallet();
  };

  const mapPoints = useMemo(() => {
    const points = [];
    if (active?.clientLocation) {
      points.push({ ...active.clientLocation, label: "Client", kind: "client" as const });
    }
    if (coords) {
      points.push({ ...coords, label: "Vous", kind: "pro" as const });
    }
    return points;
  }, [active, coords]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-xl font-semibold tracking-tight">
          {user?.name ?? "Dépanneur"}
        </p>
        <p className="text-sm text-text-secondary mt-1">
          Gérez votre disponibilité, acceptez des missions et suivez votre portefeuille.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Disponibilité</CardTitle>
            <CardDescription>Recevez des missions près de vous.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <select
                id="specialty"
                className="w-full h-12 rounded-input border border-border bg-bg-surface px-3"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value={PRO_SPECIALTIES.MECHANIC}>Mécanicien</option>
                <option value={PRO_SPECIALTIES.TIRE}>Vulcanisateur</option>
                <option value={PRO_SPECIALTIES.ELECTRICIAN}>Électricien auto</option>
              </select>
            </div>
            <Button
              variant={available ? "outline" : "primary"}
              loading={busy}
              onClick={() => locateAndToggle(!available)}
            >
              <Navigation className="h-4 w-4" />
              {available ? "Se mettre hors ligne" : "Se mettre disponible"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-brand-blue" />
              Portefeuille
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-display text-3xl font-bold text-gradient-brand">
              {formatFCFA(wallet?.balance ?? 0)}
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(wallet?.transactions ?? []).slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between text-sm border-b border-border py-2">
                  <span className="text-text-secondary truncate">{tx.description}</span>
                  <span className={tx.amount >= 0 ? "text-success" : "text-brand-red"}>
                    {tx.amount >= 0 ? "+" : ""}
                    {formatFCFA(tx.amount)}
                  </span>
                </div>
              ))}
              {!wallet?.transactions?.length && (
                <p className="text-sm text-text-secondary">Aucune transaction.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {active ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Mission active</span>
                <Badge variant={realtimeConnected ? "success" : "outline"}>
                  {realtimeConnected ? "Live" : "Polling"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {STATUS_LABEL[active.status]} · {active.client?.name ?? "Client"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClientLiveMap points={mapPoints} />
              <p>{active.problem}</p>
              <div className="flex flex-wrap gap-2">
                {active.status === "accepted" && (
                  <Button onClick={() => advance("en_route")}>Je suis en route</Button>
                )}
                {active.status === "en_route" && (
                  <Button onClick={() => advance("in_progress")}>Intervention commencée</Button>
                )}
                {active.status === "in_progress" && (
                  <Button
                    variant="urgent"
                    onClick={() => advance("completed", active.estimatedPrice ?? 10000)}
                  >
                    Terminer ({formatFCFA(active.estimatedPrice ?? 10000)})
                  </Button>
                )}
              </div>
              <div className="pt-2 space-y-2 border-t border-border">
                <p className="font-medium text-sm">Chat client</p>
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-input bg-bg-elevated p-2">
                  {chat.length === 0 ? (
                    <p className="text-text-secondary text-xs">Aucun message.</p>
                  ) : (
                    chat.map((m, i) => (
                      <p key={`${m.senderId}-${i}`} className="text-xs">
                        <span className="text-text-secondary">
                          {m.senderId === user?.id ? "Vous" : "Client"}:
                        </span>{" "}
                        {m.content}
                      </p>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Message au client…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void (async () => {
                          if (!active || !chatInput.trim()) return;
                          const content = chatInput.trim();
                          setChatInput("");
                          const res = await publishRealtimeEvent({
                            type: "chat_message",
                            interventionId: active.id,
                            content,
                          });
                          if (!res.ok) {
                            toast.error(res.error);
                            setChatInput(content);
                          }
                        })();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!active || !chatInput.trim()) return;
                      const content = chatInput.trim();
                      setChatInput("");
                      const res = await publishRealtimeEvent({
                        type: "chat_message",
                        interventionId: active.id,
                        content,
                      });
                      if (!res.ok) {
                        toast.error(res.error);
                        setChatInput(content);
                      }
                    }}
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Missions proches</CardTitle>
              <CardDescription>
                {available
                  ? "Demandes en attente autour de vous"
                  : "Passez disponible pour recevoir des missions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {missions.length === 0 ? (
                <p className="text-sm text-text-secondary">Aucune mission pour l&apos;instant.</p>
              ) : (
                missions.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-input border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">{m.problem}</p>
                      <p className="text-sm text-text-secondary">
                        {m.client?.name ?? "Client"}
                        {m.estimatedPrice ? ` · ${formatFCFA(m.estimatedPrice)}` : ""}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => accept(m.id)} disabled={!available}>
                      Accepter
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
