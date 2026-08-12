import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { User } from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

const schema = z.object({
  isAvailable: z.boolean(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  specialty: z.enum(["mecanicien", "vulcanisateur", "electricien"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.PRO]);
    if (forbidden) return forbidden;

    const body = schema.parse(await req.json());
    await connectDB();

    const pro = await User.findById(auth.user.id);
    if (!pro) return jsonError(404, "Utilisateur introuvable");

    if (body.isAvailable && (body.lat === undefined || body.lng === undefined) && !pro.location?.coordinates) {
      return jsonError(400, "Localisation requise pour devenir disponible");
    }

    pro.isAvailable = body.isAvailable;
    if (body.lat !== undefined && body.lng !== undefined) {
      pro.location = {
        type: "Point",
        coordinates: [body.lng, body.lat],
      };
    }
    if (body.specialty) pro.specialty = body.specialty;
    await pro.save();

    return jsonOk({
      isAvailable: pro.isAvailable,
      specialty: pro.specialty,
      location: pro.location?.coordinates
        ? { lng: pro.location.coordinates[0], lat: pro.location.coordinates[1] }
        : null,
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
