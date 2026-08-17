import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("users")
      .select("id, email, name, phone, role, specialty, is_verified, is_available, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (role && Object.values(USER_ROLES).includes(role as never)) {
      query = query.eq("role", role);
    }

    const { data: users } = await query;

    return jsonOk({
      users: (users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        specialty: u.specialty,
        isVerified: u.is_verified,
        isAvailable: u.is_available,
        createdAt: u.created_at,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
