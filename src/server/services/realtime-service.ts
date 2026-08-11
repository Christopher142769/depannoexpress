/**
 * Abstraction temps réel — Socket.io (primaire) ou Supabase Realtime (fallback)
 * Utilisé pour : suivi GPS dépanneur, chat, statuts d'intervention
 */

export type RealtimeEvent =
  | { type: "location_update"; interventionId: string; lat: number; lng: number }
  | { type: "chat_message"; interventionId: string; senderId: string; content: string; isVoice?: boolean }
  | { type: "status_change"; interventionId: string; status: string };

export interface RealtimeService {
  connect(token?: string): Promise<void>;
  disconnect(): void;
  subscribe(channel: string, handler: (event: RealtimeEvent) => void): () => void;
  publish(channel: string, event: RealtimeEvent): void;
  isConnected(): boolean;
}

/** Implémentation Socket.io côté client */
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
      const channel = event.interventionId ?? "global";
      this.handlers.get(channel)?.forEach((h) => h(event));
      this.handlers.get("global")?.forEach((h) => h(event));
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

/** Fallback Supabase Realtime (stub — à compléter avec @supabase/supabase-js) */
export class SupabaseRealtimeService implements RealtimeService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private channels = new Map<string, any>();

  async connect(): Promise<void> {
    // TODO: initialiser Supabase client avec NEXT_PUBLIC_SUPABASE_URL
    console.warn("[Realtime] Supabase fallback — non configuré");
  }

  disconnect(): void {
    this.channels.forEach((ch) => ch.unsubscribe());
    this.channels.clear();
  }

  subscribe(channel: string, handler: (event: RealtimeEvent) => void): () => void {
    // TODO: supabase.channel(channel).on('broadcast', ...)
    void channel;
    void handler;
    return () => {};
  }

  publish(channel: string, event: RealtimeEvent): void {
    void channel;
    void event;
  }

  isConnected(): boolean {
    return false;
  }
}

/** Factory temps réel */
export function createRealtimeService(): RealtimeService {
  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER ?? "socketio";
  if (provider === "supabase") return new SupabaseRealtimeService();
  return new SocketIORealtimeService();
}
