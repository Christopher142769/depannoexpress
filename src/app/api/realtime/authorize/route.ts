import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { requireSession } from "@/server/auth/guards";
import { assertInterventionParty } from "@/server/auth/intervention-access";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { interventionChannel } from "@/lib/realtime/realtime-service";

const schema = z.object({
  interventionId: z.string().min(1),
});

/** Autorise l’abonnement au canal intervention:{id} si l’utilisateur est partie prenante. */
export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const { interventionId } = schema.parse({
      interventionId: searchParams.get("interventionId"),
    });

    await connectDB();
    const access = await assertInterventionParty(auth.user, interventionId);
    if (!access.ok) return jsonError(access.status, access.error);

    return jsonOk({
      ok: true,
      channel: interventionChannel(interventionId),
      userId: auth.user.id,
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
