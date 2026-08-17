import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { getOrCreateWallet } from "@/server/services/wallet-service";
import { USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.PRO,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    const wallet = await getOrCreateWallet(auth.user.id);

    const supabase = getSupabaseAdmin();
    const { data: transactions } = await supabase
      .from("wallet_transactions")
      .select("id, type, amount, balance_after, description, intervention_id, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return jsonOk({
      balance: wallet?.balance ?? 0,
      transactions: (transactions ?? []).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balance_after,
        description: t.description,
        interventionId: t.intervention_id,
        createdAt: t.created_at,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
