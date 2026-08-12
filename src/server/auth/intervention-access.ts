import { Types } from "mongoose";
import { Intervention } from "@/server/db/models";
import type { AuthUser } from "@/server/auth/guards";
import { USER_ROLES } from "@/lib/constants";

/** Vérifie que l’utilisateur est partie prenante de l’intervention. */
export async function assertInterventionParty(
  user: AuthUser,
  interventionId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!Types.ObjectId.isValid(interventionId)) {
    return { ok: false, status: 400, error: "Identifiant invalide" };
  }

  const doc = await Intervention.findById(interventionId).select("clientId proId").lean();
  if (!doc) return { ok: false, status: 404, error: "Intervention introuvable" };

  const isAdmin =
    user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
  const isClient = doc.clientId.toString() === user.id;
  const isPro = doc.proId?.toString() === user.id;

  if (!isAdmin && !isClient && !isPro) {
    return { ok: false, status: 403, error: "Accès refusé à ce canal" };
  }

  return { ok: true };
}
