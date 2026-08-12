import { connectDB } from "@/server/db/mongodb";
import { User } from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (role && Object.values(USER_ROLES).includes(role as never)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("email name phone role specialty isVerified isAvailable createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return jsonOk({
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        specialty: u.specialty,
        isVerified: u.isVerified,
        isAvailable: u.isAvailable,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
