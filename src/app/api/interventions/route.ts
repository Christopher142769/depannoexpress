import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { INTERVENTION_STATUS } from "@/server/db/types";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { serializeIntervention } from "@/server/api/serialize";
import { sanitizeText } from "@/lib/sanitize";
import { USER_ROLES } from "@/lib/constants";

const ACTIVE_STATUSES = [
  INTERVENTION_STATUS.PENDING,
  INTERVENTION_STATUS.ACCEPTED,
  INTERVENTION_STATUS.EN_ROUTE,
  INTERVENTION_STATUS.IN_PROGRESS,
];

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

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "1";

    let query = supabase
      .from("interventions")
      .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
      .eq("client_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (activeOnly) {
      query = query.in("status", ACTIVE_STATUSES);
    }

    const { data: items } = await query;

    return jsonOk({ interventions: (items ?? []).map((i) => serializeIntervention(i)) });
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
    const supabase = getSupabaseAdmin();

    // Check for active intervention
    const { data: active } = await supabase
      .from("interventions")
      .select("id")
      .eq("client_id", auth.user.id)
      .in("status", ACTIVE_STATUSES)
      .limit(1)
      .single();

    if (active) {
      return jsonError(409, "Vous avez déjà une intervention en cours");
    }

    // Build GeoJSON point for client_location
    const clientLocation = `POINT(${body.lng} ${body.lat})`;

    const { data: created, error: insertError } = await supabase
      .from("interventions")
      .insert({
        client_id: auth.user.id,
        problem: sanitizeText(body.problem, 1000),
        client_location: clientLocation,
        client_address: body.address ? sanitizeText(body.address, 300) : null,
        estimated_price: body.estimatedPrice ?? null,
        status: INTERVENTION_STATUS.PENDING,
      })
      .select("*, client:users!interventions_client_id_fkey(id, name, phone), pro:users!interventions_pro_id_fkey(id, name, phone, specialty)")
      .single();

    if (insertError) throw new Error(insertError.message);

    return jsonOk({ intervention: serializeIntervention(created!) }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
