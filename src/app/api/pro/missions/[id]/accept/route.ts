import { connectDB } from "@/server/db/mongodb";
import { Intervention, INTERVENTION_STATUS, User } from "@/server/db/models";
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
    await connectDB();

    const busy = await Intervention.findOne({
      proId: auth.user.id,
      status: {
        $in: [
          INTERVENTION_STATUS.ACCEPTED,
          INTERVENTION_STATUS.EN_ROUTE,
          INTERVENTION_STATUS.IN_PROGRESS,
        ],
      },
    });
    if (busy) {
      return jsonError(409, "Vous avez déjà une mission active");
    }

    const doc = await Intervention.findOneAndUpdate(
      {
        _id: id,
        status: INTERVENTION_STATUS.PENDING,
        $or: [{ proId: null }, { proId: { $exists: false } }],
      },
      {
        $set: {
          status: INTERVENTION_STATUS.ACCEPTED,
          proId: auth.user.id,
        },
      },
      { new: true }
    )
      .populate("clientId", "name phone")
      .populate("proId", "name phone specialty");

    if (!doc) {
      return jsonError(409, "Mission déjà prise ou introuvable");
    }

    await User.findByIdAndUpdate(auth.user.id, { isAvailable: false });

    void broadcastInterventionEvent(doc._id.toString(), {
      type: "status_change",
      interventionId: doc._id.toString(),
      status: INTERVENTION_STATUS.ACCEPTED,
    });

    return jsonOk({ intervention: serializeIntervention(doc.toObject()) });
  } catch (err) {
    return handleRouteError(err);
  }
}
