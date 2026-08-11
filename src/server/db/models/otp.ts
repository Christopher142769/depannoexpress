import mongoose, { Schema, type Model, type Document } from "mongoose";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";

export interface IOTP extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
    attempts: { type: Number, default: 0, max: 5 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OTPSchema.index({ email: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP: Model<IOTP> =
  mongoose.models.OTP ?? mongoose.model<IOTP>("OTP", OTPSchema);
