import { connectDB } from "@/server/db/mongodb";
import { WalletTransaction } from "@/server/db/models";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonOk } from "@/server/api/http";
import { getOrCreateWallet } from "@/server/services/wallet-service";
import { USER_ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [
      USER_ROLES.PRO,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ]);
    if (forbidden) return forbidden;

    await connectDB();
    const wallet = await getOrCreateWallet(auth.user.id);
    const transactions = await WalletTransaction.find({ userId: auth.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return jsonOk({
      balance: wallet.balance,
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        description: t.description,
        interventionId: t.interventionId?.toString(),
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
