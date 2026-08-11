import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

export interface IProduct extends Document {
  vendorId: Types.ObjectId;
  name: string;
  description: string;
  category: "pneu" | "piece" | "accessoire";
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: ["pneu", "piece", "accessoire"], required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    imageUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1, isActive: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);
