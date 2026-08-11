import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

export interface IReview extends Document {
  interventionId: Types.ObjectId;
  clientId: Types.ObjectId;
  proId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    interventionId: { type: Schema.Types.ObjectId, ref: "Intervention", required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    proId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReviewSchema.index({ proId: 1, rating: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", ReviewSchema);
