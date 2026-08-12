import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { Intervention, INTERVENTION_STATUS } from "@/server/db/models";
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

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { id } = await ctx.params;

    await connectDB();
    const doc = await Intervention.findById(id)
      .populate("clientId", "name phone")
      .populate("proId", "name phone specialty")
      .lean();
    if (!doc) return jsonError(404, "Intervention introuvable");

    const clientId = serializeId(doc.clientId);
    const proId = serializeId(doc.proId);
    const isParty =
      auth.user.id === clientId ||
      auth.user.id === proId ||
      auth.user.role === USER_ROLES.ADMIN ||
      auth.user.role === USER_ROLES.SUPER_ADMIN;
    if (!isParty) return jsonError(403, "Accès refusé");

    return jsonOk({ intervention: serializeIntervention(doc) });
  } catch (err) {
    return handleRouteError(err);
  }
}

function serializeId(
  value:
    | { _id?: { toString(): string }; toString?: () => string }
    | string
    | undefined
    | null
) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if ("_id" in value && value._id) return value._id.toString();
  if (typeof value.toString === "function") return value.toString();
  return undefined;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    await connectDB();
    const doc = await Intervention.findById(id);
    if (!doc) return jsonError(404, "Intervention introuvable");

    const isClient = auth.user.id === doc.clientId.toString();
    const isPro = doc.proId && auth.user.id === doc.proId.toString();
    const isAdmin =
      auth.user.role === USER_ROLES.ADMIN ||
      auth.user.role === USER_ROLES.SUPER_ADMIN;

    if (!isClient && !isPro && !isAdmin) {
      return jsonError(403, "Accès refusé");
    }

    if (body.problem && isClient && doc.status === INTERVENTION_STATUS.PENDING) {
      doc.problem = sanitizeText(body.problem, 1000);
    }

    if (body.proLat !== undefined && body.proLng !== undefined && isPro) {
      doc.proLocation = {
        type: "Point",
        coordinates: [body.proLng, body.proLat],
      };
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
        doc.status = next;
        doc.cancelledBy = isPro ? "pro" : isClient ? "client" : "admin";
        doc.cancellationPenalty = CANCELLATION_PENALTY;
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
        doc.status = next;
        if (next === INTERVENTION_STATUS.COMPLETED) {
          doc.completedAt = new Date();
          doc.finalPrice =
            body.finalPrice ?? doc.estimatedPrice ?? doc.finalPrice ?? 5000;
          if (doc.proId) {
            await creditProOnCompletion({
              proId: doc.proId,
              interventionId: doc._id,
              finalPrice: doc.finalPrice,
            });
          }
        }
      } else {
        return jsonError(403, "Seuls le dépanneur ou un admin peuvent changer ce statut");
      }
    }

    await doc.save();

    if (body.proLat !== undefined && body.proLng !== undefined && isPro) {
      void broadcastInterventionEvent(doc._id.toString(), {
        type: "location_update",
        interventionId: doc._id.toString(),
        lat: body.proLat,
        lng: body.proLng,
        senderId: auth.user.id,
      });
    }

    if (body.status) {
      void broadcastInterventionEvent(doc._id.toString(), {
        type: "status_change",
        interventionId: doc._id.toString(),
        status: doc.status,
      });
    }

    const populated = await Intervention.findById(doc._id)
      .populate("clientId", "name phone")
      .populate("proId", "name phone specialty")
      .lean();

    return jsonOk({ intervention: serializeIntervention(populated!) });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
