import { getSupabaseAdmin } from "@/server/db/supabase";
import { INTERVENTION_STATUS } from "@/server/db/types";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { NEARBY_RADIUS_KM, USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.PRO]);
    if (forbidden) return forbidden;

    const supabase = getSupabaseAdmin();

    const { data: pro } = await supabase
      .from("users")
      .select("id, location, is_available")
      .eq("id", auth.user.id)
      .single();

    if (!pro?.location) {
      return jsonOk({ missions: [], message: "Activez votre localisation d'abord" });
    }

    // Find nearby pending missions
    const { data: missions } = await supabase.rpc("find_nearby_missions", {
      lng: 0,
      lat: 0,
      radius_meters: NEARBY_RADIUS_KM * 1000,
    });

    // Find active mission for this pro
    const { data: active } = await supabase
      .from("interventions")
      .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
      .eq("pro_id", auth.user.id)
      .in("status", [
        INTERVENTION_STATUS.ACCEPTED,
        INTERVENTION_STATUS.EN_ROUTE,
        INTERVENTION_STATUS.IN_PROGRESS,
      ])
      .limit(1)
      .single();

    return jsonOk({
      missions: (missions ?? []).map((m: Record<string, unknown>) => serializeIntervention(m as Parameters<typeof serializeIntervention>[0])),
      active: active ? serializeIntervention(active) : null,
      available: pro.is_available,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
