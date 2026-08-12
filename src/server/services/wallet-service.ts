import { Types } from "mongoose";
import { Wallet, WalletTransaction, WALLET_TX_TYPE } from "@/server/db/models";
import { COMMISSION_RATE_PERCENT } from "@/lib/constants";

/** Crédite le portefeuille pro à la complétion d'une intervention */
export async function creditProOnCompletion(params: {
  proId: string | Types.ObjectId;
  interventionId: string | Types.ObjectId;
  finalPrice: number;
}) {
  const gross = Math.max(0, Math.round(params.finalPrice));
  if (gross <= 0) return null;

  const commission = Math.round((gross * COMMISSION_RATE_PERCENT) / 100);
  const net = Math.max(0, gross - commission);
  const proId = new Types.ObjectId(params.proId);
  const interventionId = new Types.ObjectId(params.interventionId);

  let wallet = await Wallet.findOne({ userId: proId });
  if (!wallet) {
    wallet = await Wallet.create({ userId: proId, balance: 0 });
  }

  if (net > 0) {
    wallet.balance += net;
    await wallet.save();
    await WalletTransaction.create({
      userId: proId,
      type: WALLET_TX_TYPE.CREDIT,
      amount: net,
      balanceAfter: wallet.balance,
      description: "Paiement intervention",
      interventionId,
    });
  }

  if (commission > 0) {
    await WalletTransaction.create({
      userId: proId,
      type: WALLET_TX_TYPE.COMMISSION,
      amount: -commission,
      balanceAfter: wallet.balance,
      description: `Commission plateforme (${COMMISSION_RATE_PERCENT}%)`,
      interventionId,
    });
  }

  return { net, commission, balance: wallet.balance };
}

export async function getOrCreateWallet(userId: string | Types.ObjectId) {
  const id = new Types.ObjectId(userId);
  let wallet = await Wallet.findOne({ userId: id });
  if (!wallet) {
    wallet = await Wallet.create({ userId: id, balance: 0 });
  }
  return wallet;
}
