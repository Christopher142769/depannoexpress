import { connectDB } from "@/server/db/mongodb";
import { Intervention } from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const interventions = await Intervention.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("clientId", "name phone")
      .populate("proId", "name phone specialty")
      .lean();

    return jsonOk({
      interventions: interventions.map((i) => serializeIntervention(i)),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
