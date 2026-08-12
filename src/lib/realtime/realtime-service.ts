import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

export type RealtimeEvent =
  | { type: "location_update"; interventionId: string; lat: number; lng: number; senderId?: string }
  | {
      type: "chat_message";
      interventionId: string;
      senderId: string;
      content: string;
      isVoice?: boolean;
    }
  | { type: "status_change"; interventionId: string; status: string };

export interface RealtimeService {
  connect(token?: string): Promise<void>;
  disconnect(): void;
  subscribe(channel: string, handler: (event: RealtimeEvent) => void): () => void;
  publish(channel: string, event: RealtimeEvent): void;
  isConnected(): boolean;
}

export function interventionChannel(interventionId: string) {
  return `intervention:${interventionId}`;
}

function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

/**
 * Supabase Realtime (broadcast) — Option B
 * L’abonnement client est précédé d’un contrôle d’appartenance via /api/realtime/authorize.
 * Les publications sensibles passent par /api/realtime/publish (service role).
 */
export class SupabaseRealtimeService implements RealtimeService {
  private client: SupabaseClient | null = null;
  private channels = new Map<string, RealtimeChannel>();
  private handlers = new Map<string, Set<(event: RealtimeEvent) => void>>();
  private connected = false;
  private accessToken: string | undefined;

  async connect(token?: string): Promise<void> {
    if (typeof window === "undefined") return;
    this.accessToken = token;
    this.client = createBrowserClient();
    if (!this.client) {
      console.warn("[Realtime] Supabase non configuré (URL / ANON KEY manquants)");
      this.connected = false;
      return;
    }
    if (token) {
      await this.client.realtime.setAuth(token);
    }
    this.connected = true;
  }

  disconnect(): void {
    this.channels.forEach((ch) => {
      void this.client?.removeChannel(ch);
    });
    this.channels.clear();
    this.handlers.clear();
    this.connected = false;
    this.client = null;
  }

  subscribe(channel: string, handler: (event: RealtimeEvent) => void): () => void {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);

    if (!this.channels.has(channel) && this.client) {
      const ch = this.client
        .channel(channel, { config: { broadcast: { self: true } } })
        .on("broadcast", { event: "realtime" }, ({ payload }) => {
          const event = payload as RealtimeEvent;
          this.handlers.get(channel)?.forEach((h) => h(event));
        })
        .subscribe();
      this.channels.set(channel, ch);
    }

    return () => {
      this.handlers.get(channel)?.delete(handler);
      if ((this.handlers.get(channel)?.size ?? 0) === 0) {
        const ch = this.channels.get(channel);
        if (ch && this.client) void this.client.removeChannel(ch);
        this.channels.delete(channel);
        this.handlers.delete(channel);
      }
    };
  }

  /** Publish côté client — préférer l’API serveur pour les événements métier. */
  publish(channel: string, event: RealtimeEvent): void {
    const ch = this.channels.get(channel);
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "realtime",
      payload: event,
    });
  }

  isConnected(): boolean {
    return this.connected && !!this.client;
  }
}

/** Conservé pour compatibilité ; non utilisé une fois Option B retenue. */
export class SocketIORealtimeService implements RealtimeService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private handlers = new Map<string, Set<(event: RealtimeEvent) => void>>();

  async connect(token?: string): Promise<void> {
    if (typeof window === "undefined") return;
    const { io } = await import("socket.io-client");
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
    this.socket = io(url, {
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
    });
    this.socket.on("realtime", (event: RealtimeEvent) => {
      const channel = event.interventionId
        ? interventionChannel(event.interventionId)
        : "global";
      this.handlers.get(channel)?.forEach((h) => h(event));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribe(channel: string, handler: (event: RealtimeEvent) => void): () => void {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
    return () => this.handlers.get(channel)?.delete(handler);
  }

  publish(channel: string, event: RealtimeEvent): void {
    this.socket?.emit("realtime", { channel, ...event });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export function createRealtimeService(): RealtimeService {
  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER ?? "supabase";
  if (provider === "socketio") return new SocketIORealtimeService();
  return new SupabaseRealtimeService();
}
