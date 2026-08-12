import { connectDB } from "@/server/db/mongodb";
import { User } from "@/server/db/models";
import { getSessionFromCookies } from "@/server/auth/session";
import { toAuthUser } from "@/server/auth/guards";
import { handleRouteError, jsonError, jsonOk } from "@/server/api/http";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) return jsonError(401, "Non authentifié");

    await connectDB();
    const userDoc = await User.findById(session.sub);
    if (!userDoc) return jsonError(401, "Session invalide");

    return jsonOk({ user: toAuthUser(userDoc) });
  } catch (err) {
    return handleRouteError(err);
  }
}
