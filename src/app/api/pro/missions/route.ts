import { connectDB } from "@/server/db/mongodb";
import { Intervention, INTERVENTION_STATUS, User } from "@/server/db/models";
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

    await connectDB();
    const pro = await User.findById(auth.user.id);
    if (!pro?.location?.coordinates) {
      return jsonOk({ missions: [], message: "Activez votre localisation d'abord" });
    }

    const [lng, lat] = pro.location.coordinates;
    const missions = await Intervention.find({
      status: INTERVENTION_STATUS.PENDING,
      clientLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: NEARBY_RADIUS_KM * 1000,
        },
      },
    })
      .populate("clientId", "name phone")
      .limit(30)
      .lean();

    const active = await Intervention.findOne({
      proId: auth.user.id,
      status: {
        $in: [
          INTERVENTION_STATUS.ACCEPTED,
          INTERVENTION_STATUS.EN_ROUTE,
          INTERVENTION_STATUS.IN_PROGRESS,
        ],
      },
    })
      .populate("clientId", "name phone")
      .lean();

    return jsonOk({
      missions: missions.map((m) => serializeIntervention(m)),
      active: active ? serializeIntervention(active) : null,
      available: !!pro.isAvailable,
      location: { lng, lat },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
