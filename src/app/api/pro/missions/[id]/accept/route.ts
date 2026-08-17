import { getSupabaseAdmin } from "@/server/db/supabase";
import { INTERVENTION_STATUS } from "@/server/db/types";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { broadcastInterventionEvent } from "@/server/services/realtime-broadcast";
import { USER_ROLES } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.PRO]);
    if (forbidden) return forbidden;

    const { id } = await ctx.params;
    const supabase = getSupabaseAdmin();

    // Check if pro already has an active mission
    const { data: busy } = await supabase
      .from("interventions")
      .select("id")
      .eq("pro_id", auth.user.id)
      .in("status", [
        INTERVENTION_STATUS.ACCEPTED,
        INTERVENTION_STATUS.EN_ROUTE,
        INTERVENTION_STATUS.IN_PROGRESS,
      ])
      .limit(1)
      .single();

    if (busy) {
      return jsonError(409, "Vous avez déjà une mission active");
    }

    // Atomic accept: only accept if pending and not yet assigned
    const { data: doc, error: updateError } = await supabase
      .from("interventions")
      .update({
        status: INTERVENTION_STATUS.ACCEPTED,
        pro_id: auth.user.id,
      })
      .eq("id", id)
      .eq("status", INTERVENTION_STATUS.PENDING)
      .is("pro_id", null)
      .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
      .single();

    if (updateError || !doc) {
      return jsonError(409, "Mission déjà prise ou introuvable");
    }

    // Set pro as unavailable
    await supabase
      .from("users")
      .update({ is_available: false })
      .eq("id", auth.user.id);

    void broadcastInterventionEvent(doc.id, {
      type: "status_change",
      interventionId: doc.id,
      status: INTERVENTION_STATUS.ACCEPTED,
    });

    return jsonOk({ intervention: serializeIntervention(doc) });
  } catch (err) {
    return handleRouteError(err);
  }
}
