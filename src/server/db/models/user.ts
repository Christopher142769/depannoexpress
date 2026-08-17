import mongoose, { Schema, type Model, type Document } from "mongoose";
import { USER_ROLES, PRO_SPECIALTIES } from "@/lib/constants";

export interface IUser extends Document {
  email: string;
  name: string;
  phone?: string;
  passwordHash?: string;
  role: (typeof USER_ROLES)[keyof typeof USER_ROLES];
  specialty?: (typeof PRO_SPECIALTIES)[keyof typeof PRO_SPECIALTIES];
  avatarUrl?: string;
  isVerified: boolean;
  isAvailable?: boolean;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CLIENT,
    },
    specialty: {
      type: String,
      enum: Object.values(PRO_SPECIALTIES),
    },
    avatarUrl: String,
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ role: 1, isAvailable: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
