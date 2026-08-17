import { getSupabaseAdmin } from "@/server/db/supabase";
import { WALLET_TX_TYPE } from "@/server/db/types";
import type { WalletTxType } from "@/server/db/types";
import { COMMISSION_RATE_PERCENT } from "@/lib/constants";

export async function creditProOnCompletion(params: {
  proId: string;
  interventionId: string;
  finalPrice: number;
}) {
  const gross = Math.max(0, Math.round(params.finalPrice));
  if (gross <= 0) return null;

  const commission = Math.round((gross * COMMISSION_RATE_PERCENT) / 100);
  const net = Math.max(0, gross - commission);
  const supabase = getSupabaseAdmin();

  // Get or create wallet
  let { data: wallet } = await supabase
    .from("wallets")
    .select("id, balance")
    .eq("user_id", params.proId)
    .single();

  if (!wallet) {
    const { data: created } = await supabase
      .from("wallets")
      .insert({ user_id: params.proId, balance: 0 })
      .select("id, balance")
      .single();
    wallet = created;
  }

  if (!wallet) return null;

  const newBalance = wallet.balance + net;

  if (net > 0) {
    await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    await supabase.from("wallet_transactions").insert({
      user_id: params.proId,
      type: WALLET_TX_TYPE.CREDIT,
      amount: net,
      balance_after: newBalance,
      description: "Paiement intervention",
      intervention_id: params.interventionId,
    });
  }

  if (commission > 0) {
    await supabase.from("wallet_transactions").insert({
      user_id: params.proId,
      type: WALLET_TX_TYPE.COMMISSION,
      amount: -commission,
      balance_after: newBalance,
      description: `Commission plateforme (${COMMISSION_RATE_PERCENT}%)`,
      intervention_id: params.interventionId,
    });
  }

  return { net, commission, balance: newBalance };
}

export async function getOrCreateWallet(userId: string) {
  const supabase = getSupabaseAdmin();

  let { data: wallet } = await supabase
    .from("wallets")
    .select("id, user_id, balance, created_at, updated_at")
    .eq("user_id", userId)
    .single();

  if (!wallet) {
    const { data: created } = await supabase
      .from("wallets")
      .insert({ user_id: userId, balance: 0 })
      .select("id, user_id, balance, created_at, updated_at")
      .single();
    wallet = created;
  }

  return wallet;
}
