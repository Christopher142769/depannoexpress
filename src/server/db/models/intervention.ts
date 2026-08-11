import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

/** Statuts d'une intervention */
export const INTERVENTION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EN_ROUTE: "en_route",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export interface IIntervention extends Document {
  clientId: Types.ObjectId;
  proId?: Types.ObjectId;
  status: (typeof INTERVENTION_STATUS)[keyof typeof INTERVENTION_STATUS];
  problem: string;
  clientLocation: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  proLocation?: {
    type: "Point";
    coordinates: [number, number];
  };
  estimatedPrice?: number;
  finalPrice?: number;
  cancellationPenalty?: number;
  cancelledBy?: "client" | "pro" | "admin";
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const InterventionSchema = new Schema<IIntervention>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    proId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: Object.values(INTERVENTION_STATUS),
      default: INTERVENTION_STATUS.PENDING,
    },
    problem: { type: String, required: true },
    clientLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    proLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
    },
    estimatedPrice: Number,
    finalPrice: Number,
    cancellationPenalty: { type: Number, default: 0 },
    cancelledBy: { type: String, enum: ["client", "pro", "admin"] },
    completedAt: Date,
  },
  { timestamps: true }
);

InterventionSchema.index({ clientLocation: "2dsphere" });
InterventionSchema.index({ status: 1, createdAt: -1 });

export const Intervention: Model<IIntervention> =
  mongoose.models.Intervention ??
  mongoose.model<IIntervention>("Intervention", InterventionSchema);
