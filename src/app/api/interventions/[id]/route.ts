import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { INTERVENTION_STATUS } from "@/server/db/types";
import { requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { sanitizeText } from "@/lib/sanitize";
import { creditProOnCompletion } from "@/server/services/wallet-service";
import { broadcastInterventionEvent } from "@/server/services/realtime-broadcast";
import { CANCELLATION_PENALTY, USER_ROLES } from "@/lib/constants";

const patchSchema = z.object({
  status: z
    .enum([
      INTERVENTION_STATUS.EN_ROUTE,
      INTERVENTION_STATUS.IN_PROGRESS,
      INTERVENTION_STATUS.COMPLETED,
      INTERVENTION_STATUS.CANCELLED,
    ])
    .optional(),
  finalPrice: z.number().min(0).max(5_000_000).optional(),
  proLat: z.number().min(-90).max(90).optional(),
  proLng: z.number().min(-180).max(180).optional(),
  problem: z.string().min(5).max(1000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function fetchIntervention(supabase: ReturnType<typeof getSupabaseAdmin>, id: string) {
  return supabase
    .from("interventions")
    .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
    .eq("id", id)
    .single();
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const { id } = await ctx.params;

    const supabase = getSupabaseAdmin();
    const { data: doc } = await fetchIntervention(supabase, id);

    if (!doc) return jsonError(404, "Intervention introuvable");

    const isParty =
      auth.user.id === doc.client_id ||
      auth.user.id === doc.pro_id ||
      auth.user.role === USER_ROLES.ADMIN ||
      auth.user.role === USER_ROLES.SUPER_ADMIN;
    if (!isParty) return jsonError(403, "Accès refusé");

    return jsonOk({ intervention: serializeIntervention(doc) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const supabase = getSupabaseAdmin();
    const { data: doc } = await supabase
      .from("interventions")
      .select("*")
      .eq("id", id)
      .single();

    if (!doc) return jsonError(404, "Intervention introuvable");

    const isClient = auth.user.id === doc.client_id;
    const isPro = doc.pro_id === auth.user.id;
    const isAdmin =
      auth.user.role === USER_ROLES.ADMIN ||
      auth.user.role === USER_ROLES.SUPER_ADMIN;

    if (!isClient && !isPro && !isAdmin) {
      return jsonError(403, "Accès refusé");
    }

    const updates: Record<string, unknown> = {};

    if (body.problem && isClient && doc.status === INTERVENTION_STATUS.PENDING) {
      updates.problem = sanitizeText(body.problem, 1000);
    }

    if (body.proLat !== undefined && body.proLng !== undefined && isPro) {
      updates.pro_location = `POINT(${body.proLng} ${body.proLat})`;
    }

    if (body.status) {
      const next = body.status;
      if (next === INTERVENTION_STATUS.CANCELLED) {
        const cancellable: string[] = [
          INTERVENTION_STATUS.PENDING,
          INTERVENTION_STATUS.ACCEPTED,
        ];
        if (!cancellable.includes(doc.status)) {
          return jsonError(409, "Cette intervention ne peut plus être annulée");
        }
        updates.status = next;
        updates.cancelled_by = isPro ? "pro" : isClient ? "client" : "admin";
        updates.cancellation_penalty = CANCELLATION_PENALTY;
      } else if (isPro || isAdmin) {
        const allowed: Record<string, string[]> = {
          [INTERVENTION_STATUS.ACCEPTED]: [
            INTERVENTION_STATUS.EN_ROUTE,
            INTERVENTION_STATUS.IN_PROGRESS,
          ],
          [INTERVENTION_STATUS.EN_ROUTE]: [INTERVENTION_STATUS.IN_PROGRESS],
          [INTERVENTION_STATUS.IN_PROGRESS]: [INTERVENTION_STATUS.COMPLETED],
        };
        if (!allowed[doc.status]?.includes(next)) {
          return jsonError(409, `Transition ${doc.status} → ${next} refusée`);
        }
        updates.status = next;
        if (next === INTERVENTION_STATUS.COMPLETED) {
          updates.completed_at = new Date().toISOString();
          updates.final_price =
            body.finalPrice ?? doc.estimated_price ?? doc.final_price;
          if (doc.pro_id) {
            await creditProOnCompletion({
              proId: doc.pro_id,
              interventionId: doc.id,
              finalPrice: updates.final_price as number,
            });
          }
        }
      } else {
        return jsonError(403, "Seuls le dépanneur ou un admin peuvent changer ce statut");
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError(400, "Aucune modification fournie");
    }

    const { data: updated } = await supabase
      .from("interventions")
      .update(updates)
      .eq("id", id)
      .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
      .single();

    if (body.proLat !== undefined && body.proLng !== undefined && isPro) {
      void broadcastInterventionEvent(id, {
        type: "location_update",
        interventionId: id,
        lat: body.proLat,
        lng: body.proLng,
        senderId: auth.user.id,
      });
    }

    if (body.status) {
      void broadcastInterventionEvent(id, {
        type: "status_change",
        interventionId: id,
        status: updated!.status,
      });
    }

    return jsonOk({ intervention: serializeIntervention(updated!) });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
