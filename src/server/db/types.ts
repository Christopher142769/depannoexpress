import type { UserRole, ProSpecialty } from "@/lib/constants";

export const INTERVENTION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EN_ROUTE: "en_route",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const WALLET_TX_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
  COMMISSION: "commission",
  PENALTY: "penalty",
  PAYOUT: "payout",
} as const;

export type InterventionStatus = (typeof INTERVENTION_STATUS)[keyof typeof INTERVENTION_STATUS];
export type WalletTxType = (typeof WALLET_TX_TYPE)[keyof typeof WALLET_TX_TYPE];

export interface DbUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string | null;
  role: UserRole;
  specialty: ProSpecialty | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_available: boolean;
  location: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface DbOTP {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  attempts: number;
  created_at: string;
}

export interface DbIntervention {
  id: string;
  client_id: string;
  pro_id: string | null;
  status: InterventionStatus;
  problem: string;
  client_location: unknown;
  client_address: string | null;
  pro_location: unknown;
  estimated_price: number | null;
  final_price: number | null;
  cancellation_penalty: number | null;
  cancelled_by: "client" | "pro" | "admin" | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReview {
  id: string;
  intervention_id: string;
  client_id: string;
  pro_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DbProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  category: "pneu" | "piece" | "accessoire";
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbWallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface DbWalletTransaction {
  id: string;
  user_id: string;
  type: WalletTxType;
  amount: number;
  balance_after: number;
  description: string;
  intervention_id: string | null;
  created_at: string;
}

export interface PopulatedIntervention extends DbIntervention {
  client?: { id: string; name: string; phone: string | null } | null;
  pro?: { id: string; name: string; phone: string | null; specialty: string | null } | null;
}

export interface DbTrade {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPricingRule {
  id: string;
  trade_id: string;
  base_price: number;
  price_per_km: number;
  currency: string;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
