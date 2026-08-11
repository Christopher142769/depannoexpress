import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

export const WALLET_TX_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
  COMMISSION: "commission",
  PENALTY: "penalty",
  PAYOUT: "payout",
} as const;

export interface IWalletTransaction extends Document {
  userId: Types.ObjectId;
  type: (typeof WALLET_TX_TYPE)[keyof typeof WALLET_TX_TYPE];
  amount: number;
  balanceAfter: number;
  description: string;
  interventionId?: Types.ObjectId;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(WALLET_TX_TYPE), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true },
    interventionId: { type: Schema.Types.ObjectId, ref: "Intervention" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

export const WalletTransaction: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction ??
  mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);

/** Solde portefeuille dépanneur (document séparé pour accès rapide) */
export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Wallet: Model<IWallet> =
  mongoose.models.Wallet ?? mongoose.model<IWallet>("Wallet", WalletSchema);
