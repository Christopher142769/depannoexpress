import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { Intervention, INTERVENTION_STATUS } from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { sanitizeText } from "@/lib/sanitize";
import { USER_ROLES } from "@/lib/constants";

const createSchema = z.object({
  problem: z.string().min(5).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(300).optional(),
  estimatedPrice: z.number().min(0).max(5_000_000).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.CLIENT]);
    if (forbidden) return forbidden;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "1";

    const filter: Record<string, unknown> = { clientId: auth.user.id };
    if (activeOnly) {
      filter.status = {
        $in: [
          INTERVENTION_STATUS.PENDING,
          INTERVENTION_STATUS.ACCEPTED,
          INTERVENTION_STATUS.EN_ROUTE,
          INTERVENTION_STATUS.IN_PROGRESS,
        ],
      };
    }

    const items = await Intervention.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("proId", "name phone specialty")
      .lean();

    return jsonOk({ interventions: items.map((i) => serializeIntervention(i)) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.CLIENT]);
    if (forbidden) return forbidden;

    const body = createSchema.parse(await req.json());
    await connectDB();

    const active = await Intervention.findOne({
      clientId: auth.user.id,
      status: {
        $in: [
          INTERVENTION_STATUS.PENDING,
          INTERVENTION_STATUS.ACCEPTED,
          INTERVENTION_STATUS.EN_ROUTE,
          INTERVENTION_STATUS.IN_PROGRESS,
        ],
      },
    });
    if (active) {
      return jsonError(409, "Vous avez déjà une intervention en cours");
    }

    const created = await Intervention.create({
      clientId: auth.user.id,
      problem: sanitizeText(body.problem, 1000),
      clientLocation: {
        type: "Point",
        coordinates: [body.lng, body.lat],
        address: body.address ? sanitizeText(body.address, 300) : undefined,
      },
      estimatedPrice: body.estimatedPrice,
      status: INTERVENTION_STATUS.PENDING,
    });

    return jsonOk({ intervention: serializeIntervention(created.toObject()) }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
