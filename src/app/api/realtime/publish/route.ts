import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { requireSession } from "@/server/auth/guards";
import { assertInterventionParty } from "@/server/auth/intervention-access";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { broadcastInterventionEvent } from "@/server/services/realtime-broadcast";
import { sanitizeText } from "@/lib/sanitize";
import type { RealtimeEvent } from "@/lib/realtime/realtime-service";

const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("location_update"),
    interventionId: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  z.object({
    type: z.literal("chat_message"),
    interventionId: z.string().min(1),
    content: z.string().min(1).max(1000),
    isVoice: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("status_change"),
    interventionId: z.string().min(1),
    status: z.string().min(1).max(40),
  }),
]);

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;

    const body = schema.parse(await req.json());
    await connectDB();

    const access = await assertInterventionParty(auth.user, body.interventionId);
    if (!access.ok) return jsonError(access.status, access.error);

    let event: RealtimeEvent;
    if (body.type === "location_update") {
      event = {
        type: "location_update",
        interventionId: body.interventionId,
        lat: body.lat,
        lng: body.lng,
        senderId: auth.user.id,
      };
    } else if (body.type === "chat_message") {
      event = {
        type: "chat_message",
        interventionId: body.interventionId,
        senderId: auth.user.id,
        content: sanitizeText(body.content, 1000),
        isVoice: body.isVoice,
      };
    } else {
      event = {
        type: "status_change",
        interventionId: body.interventionId,
        status: body.status,
      };
    }

    const result = await broadcastInterventionEvent(body.interventionId, event);
    if (!result.ok) {
      // Soft-fail : l’API métier reste utilisable même sans Supabase configuré
      return jsonOk({ ok: false, queued: false, reason: result.reason, event });
    }

    return jsonOk({ ok: true, event });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
