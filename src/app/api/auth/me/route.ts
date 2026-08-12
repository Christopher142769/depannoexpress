import { requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    return jsonOk({ user: auth.user });
  } catch (err) {
    return handleRouteError(err);
  }
}
