import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { User } from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonOk } from "@/server/api/http";
import { NEARBY_RADIUS_KM, USER_ROLES } from "@/lib/constants";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  specialty: z.enum(["mecanicien", "vulcanisateur", "electricien"]).optional(),
  radiusKm: z.coerce.number().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.CLIENT]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const q = querySchema.parse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      specialty: searchParams.get("specialty") ?? undefined,
      radiusKm: searchParams.get("radiusKm") ?? undefined,
    });

    await connectDB();
    const radiusMeters = (q.radiusKm ?? NEARBY_RADIUS_KM) * 1000;

    const filter: Record<string, unknown> = {
      role: USER_ROLES.PRO,
      isAvailable: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [q.lng, q.lat] },
          $maxDistance: radiusMeters,
        },
      },
    };
    if (q.specialty) filter.specialty = q.specialty;

    const pros = await User.find(filter)
      .select("name phone specialty location isAvailable")
      .limit(20)
      .lean();

    return jsonOk({
      pros: pros.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        phone: p.phone,
        specialty: p.specialty,
        isAvailable: p.isAvailable,
        location: p.location?.coordinates
          ? { lng: p.location.coordinates[0], lat: p.location.coordinates[1] }
          : null,
      })),
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
