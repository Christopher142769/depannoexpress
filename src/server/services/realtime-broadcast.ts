import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RealtimeEvent } from "@/lib/realtime/realtime-service";
import { interventionChannel } from "@/lib/realtime/realtime-service";

let admin: SupabaseClient | null | undefined;

function getAdminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    admin = null;
    return null;
  }
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Diffuse un événement sur le canal intervention:{id} via le service role. */
export async function broadcastInterventionEvent(
  interventionId: string,
  event: RealtimeEvent
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = getAdminClient();
  if (!client) {
    return { ok: false, reason: "Supabase service role non configuré" };
  }

  const channelName = interventionChannel(interventionId);
  const channel = client.channel(channelName);
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Realtime subscribe timeout")), 5000);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        resolve();
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        reject(new Error(`Realtime status: ${status}`));
      }
    });
  });

  await channel.send({
    type: "broadcast",
    event: "realtime",
    payload: event,
  });

  await client.removeChannel(channel);
  return { ok: true };
}

export function isSupabaseRealtimeConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
