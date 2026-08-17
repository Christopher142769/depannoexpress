import { getSupabaseAdmin } from "@/server/db/supabase";
import type { AuthUser } from "@/server/auth/guards";
import { USER_ROLES } from "@/lib/constants";

export async function assertInterventionParty(
  user: AuthUser,
  interventionId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const supabase = getSupabaseAdmin();
  const { data: doc, error } = await supabase
    .from("interventions")
    .select("client_id, pro_id")
    .eq("id", interventionId)
    .single();

  if (error || !doc) return { ok: false, status: 404, error: "Intervention introuvable" };

  const isAdmin =
    user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
  const isClient = doc.client_id === user.id;
  const isPro = doc.pro_id === user.id;

  if (!isAdmin && !isClient && !isPro) {
    return { ok: false, status: 403, error: "Accès refusé à ce canal" };
  }

  return { ok: true };
}
