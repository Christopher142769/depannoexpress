import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("interventions")
      .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: interventions } = await query;

    return jsonOk({
      interventions: (interventions ?? []).map((i) => serializeIntervention(i)),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
