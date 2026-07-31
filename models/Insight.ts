import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInsight extends Document {
  handle: string;
  date: Date;
  performanceReport: string;
  recommendedTopics: string[];
  analyzedSubmissionIds: number[];
}

const InsightSchema = new Schema<IInsight>(
  {
    handle: {
      type: String,
      required: [true, "Codeforces handle is required"],
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    performanceReport: {
      type: String,
      default: "",
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },
    analyzedSubmissionIds: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching latest insights for a user
InsightSchema.index({ handle: 1, date: -1 });

const Insight: Model<IInsight> =
  mongoose.models.Insight ||
  mongoose.model<IInsight>("Insight", InsightSchema);

export default Insight;
