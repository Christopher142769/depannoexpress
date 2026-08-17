import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonOk } from "@/server/api/http";
import { NEARBY_RADIUS_KM, USER_ROLES } from "@/lib/constants";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  specialty: z.string().max(100).optional(),
  radiusKm: z.coerce.number().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
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

    const supabase = getSupabaseAdmin();
    const radiusMeters = (q.radiusKm ?? NEARBY_RADIUS_KM) * 1000;

    const { data: pros } = await supabase.rpc("find_nearby_pros", {
      lng: q.lng,
      lat: q.lat,
      radius_meters: radiusMeters,
      spec: q.specialty ?? null,
    });

    return jsonOk({
      pros: (pros ?? []).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        specialty: p.specialty,
        isAvailable: p.is_available,
        location: p.lng_out && p.lat_out
          ? { lng: p.lng_out, lat: p.lat_out }
          : null,
      })),
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
