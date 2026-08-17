import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

const schema = z.object({
  isAvailable: z.boolean(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  specialty: z.string().max(100).optional(),
});

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.PRO]);
    if (forbidden) return forbidden;

    const body = schema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    if (body.specialty) {
      const { data: trade } = await supabase
        .from("trades")
        .select("id")
        .eq("slug", body.specialty)
        .eq("is_active", true)
        .single();
      if (!trade) return jsonError(400, "Métier inconnu ou inactif");
    }

    const { data: pro } = await supabase
      .from("users")
      .select("id, location, is_available")
      .eq("id", auth.user.id)
      .single();

    if (!pro) return jsonError(404, "Utilisateur introuvable");

    if (body.isAvailable && (body.lat === undefined || body.lng === undefined) && !pro.location) {
      return jsonError(400, "Localisation requise pour devenir disponible");
    }

    const updates: Record<string, unknown> = {
      is_available: body.isAvailable,
    };

    if (body.lat !== undefined && body.lng !== undefined) {
      updates.location = `POINT(${body.lng} ${body.lat})`;
    }
    if (body.specialty) updates.specialty = body.specialty;

    const { data: updated } = await supabase
      .from("users")
      .update(updates)
      .eq("id", auth.user.id)
      .select("id, is_available, specialty, location")
      .single();

    const locStr = updated!.location as string | null;
    let parsedLocation: { lat: number; lng: number } | null = null;
    if (locStr) {
      const match = locStr.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
      if (match) parsedLocation = { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }

    return jsonOk({
      isAvailable: updated!.is_available,
      specialty: updated!.specialty,
      location: parsedLocation,
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
