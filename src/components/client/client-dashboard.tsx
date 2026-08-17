"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ClientLiveMap } from "@/components/maps/client-live-map";
import { LocationLoader } from "@/components/maps/location-loader";
import { RatingStars } from "@/components/ui/rating-stars";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { formatFCFA } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  publishRealtimeEvent,
  useInterventionRealtime,
} from "@/hooks/use-intervention-realtime";
import type { RealtimeEvent } from "@/lib/realtime/realtime-service";

type Intervention = {
  id: string;
  status: string;
  problem: string;
  clientLocation: { lat: number; lng: number; address?: string } | null;
  proLocation: { lat: number; lng: number } | null;
  pro?: { id?: string; name?: string; phone?: string; specialty?: string } | null;
  estimatedPrice?: number;
  finalPrice?: number;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  en_route: "En route",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function ClientDashboard() {
  const user = useAuthStore((s) => s.user);
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [active, setActive] = useState<Intervention[]>([]);
  const [history, setHistory] = useState<Intervention[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [chat, setChat] = useState<{ senderId: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [liveProLocation, setLiveProLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const selected = useMemo(
    () => [...active, ...history].find((i) => i.id === selectedId) ?? active[0] ?? null,
    [active, history, selectedId]
  );

  const load = useCallback(async () => {
    const res = await apiFetch<{ interventions: Intervention[] }>("/api/interventions");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const items = res.data.interventions;
    setActive(
      items.filter((i) =>
        ["pending", "accepted", "en_route", "in_progress"].includes(i.status)
      )
    );
    setHistory(items.filter((i) => ["completed", "cancelled"].includes(i.status)));
  }, []);

  const onRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      if (event.type === "location_update") {
        setLiveProLocation({ lat: event.lat, lng: event.lng });
        return;
      }
      if (event.type === "status_change") {
        setActive((prev) =>
          prev.map((i) =>
            i.id === event.interventionId ? { ...i, status: event.status } : i
          )
        );
        if (["completed", "cancelled"].includes(event.status)) {
          void load();
        }
        return;
      }
      if (event.type === "chat_message") {
        setChat((prev) => [
          ...prev,
          { senderId: event.senderId, content: event.content },
        ]);
      }
    },
    [load]
  );

  const { connected: realtimeConnected } = useInterventionRealtime({
    interventionId: selected?.id,
    enabled: !!selected && !["completed", "cancelled"].includes(selected.status),
    onEvent: onRealtimeEvent,
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      setChat([]);
      setLiveProLocation(selected?.proLocation ?? null);
    }, 0);
    return () => window.clearTimeout(t);
  }, [selected?.id, selected?.proLocation]);

  useEffect(() => {
    let cancelled = false;
    const tick = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        await load();
      })();
    }, 0);
    // Polling de secours plus espacé si le realtime est connecté
    const intervalMs = realtimeConnected ? 30000 : 8000;
    const t = window.setInterval(() => {
      if (!cancelled) void load();
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearTimeout(tick);
      window.clearInterval(t);
    };
  }, [load, realtimeConnected]);

  const createIntervention = async () => {
    if (!coords) {
      toast.error("Activez d'abord votre position");
      return;
    }
    if (problem.trim().length < 5) {
      toast.error("Décrivez le problème (min. 5 caractères)");
      return;
    }
    setLoading(true);
    const res = await apiFetch<{ intervention: Intervention }>("/api/interventions", {
      method: "POST",
      body: JSON.stringify({
        problem,
        lat: coords.lat,
        lng: coords.lng,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Demande envoyée");
    setProblem("");
    setSelectedId(res.data.intervention.id);
    await load();
  };

  const cancel = async (id: string) => {
    const res = await apiFetch(`/api/interventions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Intervention annulée");
    await load();
  };

  const submitReview = async () => {
    if (!selected || selected.status !== "completed") return;
    const res = await apiFetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        interventionId: selected.id,
        rating,
        comment: comment || undefined,
      }),
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Merci pour votre avis !");
    setComment("");
  };

  const mapPoints = useMemo(() => {
    const points = [];
    if (selected?.clientLocation) {
      points.push({
        ...selected.clientLocation,
        label: "Vous",
        kind: "client" as const,
      });
    } else if (coords) {
      points.push({ ...coords, label: "Vous", kind: "client" as const });
    }
    const proLoc = liveProLocation ?? selected?.proLocation;
    if (proLoc) {
      points.push({
        ...proLoc,
        label: selected?.pro?.name ?? "Dépanneur",
        kind: "pro" as const,
      });
    }
    return points;
  }, [selected, coords, liveProLocation]);

  const sendChat = async () => {
    if (!selected || !chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput("");
    const res = await publishRealtimeEvent({
      type: "chat_message",
      interventionId: selected.id,
      content,
    });
    if (!res.ok) {
      toast.error(res.error);
      setChatInput(content);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight">
            Bonjour{user?.name ? `, ${user.name}` : ""}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            Signalez une panne ou suivez une intervention en cours.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/app/boutique">
            <ShoppingBag className="h-4 w-4" />
            Boutique
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-brand-red" />
              Signaler une panne
            </CardTitle>
            <CardDescription>
              On alerte les dépanneurs disponibles près de vous.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problem">Quel est le problème ?</Label>
              <Input
                id="problem"
                placeholder="Ex. pneu crevé, batterie à plat…"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <LocationLoader
                onLocated={(lat, lng) => setCoords({ lat, lng })}
                currentCoords={coords}
              />
              <Button
                type="button"
                variant="urgent"
                onClick={createIntervention}
                loading={loading}
                showArrow
                disabled={active.length > 0}
              >
                Demander de l&apos;aide
              </Button>
            </div>
            {active.length > 0 && (
              <p className="text-sm text-text-secondary">
                Une intervention est déjà en cours. Terminez-la ou annulez-la avant d&apos;en créer une autre.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Suivi live</span>
              {selected && (
                <Badge variant={realtimeConnected ? "success" : "outline"}>
                  {realtimeConnected ? "Live" : "Polling"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selected
                ? STATUS_LABEL[selected.status] ?? selected.status
                : "Aucune intervention sélectionnée"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientLiveMap points={mapPoints} />
            {selected && (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-text-secondary">Problème : </span>
                  {selected.problem}
                </p>
                {selected.pro?.name && (
                  <p>
                    <span className="text-text-secondary">Dépanneur : </span>
                    {selected.pro.name}
                    {selected.pro.specialty ? ` · ${selected.pro.specialty}` : ""}
                  </p>
                )}
                {(selected.estimatedPrice || selected.finalPrice) && (
                  <p>
                    <span className="text-text-secondary">Tarif : </span>
                    {formatFCFA(selected.finalPrice ?? selected.estimatedPrice ?? 0)}
                  </p>
                )}
                {["pending", "accepted"].includes(selected.status) && (
                  <Button variant="ghost" size="sm" onClick={() => cancel(selected.id)}>
                    Annuler
                  </Button>
                )}
                {!["completed", "cancelled", "pending"].includes(selected.status) && (
                  <div className="pt-3 space-y-2 border-t border-border">
                    <p className="font-medium">Chat</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 rounded-input bg-bg-elevated p-2">
                      {chat.length === 0 ? (
                        <p className="text-text-secondary text-xs">Aucun message.</p>
                      ) : (
                        chat.map((m, i) => (
                          <p key={`${m.senderId}-${i}`} className="text-xs">
                            <span className="text-text-secondary">
                              {m.senderId === user?.id ? "Vous" : "Pro"}:
                            </span>{" "}
                            {m.content}
                          </p>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Votre message…"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void sendChat();
                        }}
                      />
                      <Button size="sm" onClick={sendChat}>
                        Envoyer
                      </Button>
                    </div>
                  </div>
                )}
                {selected.status === "completed" && (
                  <div className="pt-2 space-y-3 border-t border-border">
                    <p className="font-medium">Noter le dépanneur</p>
                    <RatingStars value={rating} onChange={setRating} />
                    <Input
                      placeholder="Commentaire (optionnel)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button size="sm" onClick={submitReview}>
                      Envoyer l&apos;avis
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vos interventions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...active, ...history].length === 0 ? (
              <p className="text-text-secondary text-sm">Aucune intervention pour l&apos;instant.</p>
            ) : (
              [...active, ...history].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left rounded-input border px-4 py-3 transition-colors ${
                    selected?.id === item.id
                      ? "border-brand-blue bg-brand-blue/5"
                      : "border-border hover:bg-bg-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium truncate">{item.problem}</span>
                    <Badge variant={item.status === "completed" ? "success" : "brand"}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
