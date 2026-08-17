import { getSupabaseAdmin } from "@/server/db/supabase";
import { INTERVENTION_STATUS, WALLET_TX_TYPE } from "@/server/db/types";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
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

    const supabase = getSupabaseAdmin();

    // Parallel queries
    const [interventionsResult, prosResult, clientsResult, revenueResult] = await Promise.all([
      supabase.from("interventions").select("status"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", USER_ROLES.PRO).eq("is_available", true),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", USER_ROLES.CLIENT),
      supabase.from("wallet_transactions").select("amount").eq("type", WALLET_TX_TYPE.COMMISSION),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of Object.values(INTERVENTION_STATUS)) {
      statusMap[s] = 0;
    }
    for (const row of interventionsResult.data ?? []) {
      statusMap[row.status] = (statusMap[row.status] ?? 0) + 1;
    }

    const totalCommission = (revenueResult.data ?? [])
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

    return jsonOk({
      interventionsByStatus: statusMap,
      activePros: prosResult.count ?? 0,
      clients: clientsResult.count ?? 0,
      platformRevenue: totalCommission,
      totalInterventions: Object.values(statusMap).reduce((a, b) => a + b, 0),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
