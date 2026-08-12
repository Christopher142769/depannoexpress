import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { Intervention, INTERVENTION_STATUS, Review } from "@/server/db/models";
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
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.CLIENT]);
    if (forbidden) return forbidden;

    const body = schema.parse(await req.json());
    await connectDB();

    const intervention = await Intervention.findById(body.interventionId);
    if (!intervention) return jsonError(404, "Intervention introuvable");
    if (intervention.clientId.toString() !== auth.user.id) {
      return jsonError(403, "Accès refusé");
    }
    if (intervention.status !== INTERVENTION_STATUS.COMPLETED) {
      return jsonError(409, "L'intervention doit être terminée pour laisser un avis");
    }
    if (!intervention.proId) return jsonError(409, "Aucun dépanneur associé");

    const existing = await Review.findOne({ interventionId: intervention._id });
    if (existing) return jsonError(409, "Un avis existe déjà pour cette intervention");

    const review = await Review.create({
      interventionId: intervention._id,
      clientId: auth.user.id,
      proId: intervention.proId,
      rating: body.rating,
      comment: body.comment ? sanitizeText(body.comment, 1000) : undefined,
    });

    const agg = await Review.aggregate([
      { $match: { proId: intervention.proId } },
      { $group: { _id: "$proId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    return jsonOk(
      {
        review: {
          id: review._id.toString(),
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
        proRating: agg[0]
          ? { average: Math.round(agg[0].avg * 10) / 10, count: agg[0].count }
          : { average: review.rating, count: 1 },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
