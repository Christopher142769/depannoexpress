import { connectDB } from "@/server/db/mongodb";
import {
  Intervention,
  INTERVENTION_STATUS,
  User,
  WalletTransaction,
  WALLET_TX_TYPE,
} from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    await connectDB();

    const [byStatus, prosActive, clients, revenue] = await Promise.all([
      Intervention.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.countDocuments({ role: USER_ROLES.PRO, isAvailable: true }),
      User.countDocuments({ role: USER_ROLES.CLIENT }),
      WalletTransaction.aggregate([
        { $match: { type: WALLET_TX_TYPE.COMMISSION } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(
      Object.values(INTERVENTION_STATUS).map((s) => [s, 0])
    );
    for (const row of byStatus) {
      statusMap[row._id] = row.count;
    }

    return jsonOk({
      interventionsByStatus: statusMap,
      activePros: prosActive,
      clients,
      platformRevenue: revenue[0]?.total ?? 0,
      totalInterventions: Object.values(statusMap).reduce((a, b) => a + b, 0),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
