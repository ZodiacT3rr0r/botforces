import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  nextAllowedAt: number;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nextAllowedAt: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export default RateLimit;

