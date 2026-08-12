"use client";

import { useEffect, useRef, useState } from "react";
import {
  createRealtimeService,
  interventionChannel,
  type RealtimeEvent,
  type RealtimeService,
} from "@/lib/realtime/realtime-service";
import { apiFetch } from "@/lib/api-client";

type Options = {
  interventionId: string | null | undefined;
  onEvent?: (event: RealtimeEvent) => void;
  enabled?: boolean;
};

/**
 * Abonne le client au canal intervention:{id} après autorisation serveur.
 */
export function useInterventionRealtime({
  interventionId,
  onEvent,
  enabled = true,
}: Options) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onEventRef = useRef(onEvent);
  const serviceRef = useRef<RealtimeService | null>(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let bootTimer: number | undefined;

    if (!enabled || !interventionId) {
      bootTimer = window.setTimeout(() => {
        if (!cancelled) {
          setConnected(false);
          setError(null);
        }
      }, 0);
      return () => {
        cancelled = true;
        if (bootTimer) window.clearTimeout(bootTimer);
      };
    }

    bootTimer = window.setTimeout(() => {
      void (async () => {
        const authz = await apiFetch<{ channel: string }>(
          `/api/realtime/authorize?interventionId=${encodeURIComponent(interventionId)}`
        );
        if (cancelled) return;
        if (!authz.ok) {
          setError(authz.error);
          setConnected(false);
          return;
        }

        const service = createRealtimeService();
        serviceRef.current = service;
        await service.connect();
        if (cancelled) {
          service.disconnect();
          return;
        }

        if (!service.isConnected()) {
          setError("Realtime indisponible (Supabase non configuré)");
          setConnected(false);
          return;
        }

        const channel = interventionChannel(interventionId);
        unsubscribe = service.subscribe(channel, (event) => {
          onEventRef.current?.(event);
        });
        setConnected(true);
        setError(null);
      })();
    }, 0);

    return () => {
      cancelled = true;
      if (bootTimer) window.clearTimeout(bootTimer);
      unsubscribe?.();
      serviceRef.current?.disconnect();
      serviceRef.current = null;
    };
  }, [interventionId, enabled]);

  return { connected, error };
}

export async function publishRealtimeEvent(
  event:
    | {
        type: "location_update";
        interventionId: string;
        lat: number;
        lng: number;
      }
    | {
        type: "chat_message";
        interventionId: string;
        content: string;
        isVoice?: boolean;
      }
    | {
        type: "status_change";
        interventionId: string;
        status: string;
      }
) {
  return apiFetch("/api/realtime/publish", {
    method: "POST",
    body: JSON.stringify(event),
  });
}
