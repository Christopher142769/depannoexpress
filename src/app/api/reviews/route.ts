import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { INTERVENTION_STATUS } from "@/server/db/types";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { sanitizeText } from "@/lib/sanitize";
import { USER_ROLES } from "@/lib/constants";

const schema = z.object({
  interventionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.CLIENT]);
    if (forbidden) return forbidden;

    const body = schema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: intervention } = await supabase
      .from("interventions")
      .select("id, client_id, pro_id, status")
      .eq("id", body.interventionId)
      .single();

    if (!intervention) return jsonError(404, "Intervention introuvable");
    if (intervention.client_id !== auth.user.id) {
      return jsonError(403, "Accès refusé");
    }
    if (intervention.status !== INTERVENTION_STATUS.COMPLETED) {
      return jsonError(409, "L'intervention doit être terminée pour laisser un avis");
    }
    if (!intervention.pro_id) return jsonError(409, "Aucun dépanneur associé");

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("intervention_id", intervention.id)
      .limit(1)
      .single();

    if (existing) return jsonError(409, "Un avis existe déjà pour cette intervention");

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        intervention_id: intervention.id,
        client_id: auth.user.id,
        pro_id: intervention.pro_id,
        rating: body.rating,
        comment: body.comment ? sanitizeText(body.comment, 1000) : null,
      })
      .select("id, rating, comment, created_at")
      .single();

    if (insertError) throw new Error(insertError.message);

    // Compute average rating
    const { data: aggData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("pro_id", intervention.pro_id);

    const ratings = aggData ?? [];
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / (ratings.length || 1);

    return jsonOk(
      {
        review: {
          id: review!.id,
          rating: review!.rating,
          comment: review!.comment,
          createdAt: review!.created_at,
        },
        proRating: {
          average: Math.round(avg * 10) / 10,
          count: ratings.length,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
