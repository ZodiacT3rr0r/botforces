import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmission extends Document {
  handle: string;
  handleLower: string;
  submissionId: number;
  contestId: number;
  problemIndex: string;
  problemName: string;
  problemRating: number;
  verdict: string;
  programmingLanguage: string;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  passedTestCount: number;
  tags: string[];
  sourceCode: string;
  creationTimeSeconds: number;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    handle: {
      type: String,
      required: [true, "Codeforces handle is required"],
      trim: true,
    },
    handleLower: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    submissionId: {
      type: Number,
      required: true,
      unique: true,
    },
    contestId: {
      type: Number,
      required: true,
    },
    problemIndex: {
      type: String,
      default: "",
    },
    problemName: {
      type: String,
      default: "",
    },
    problemRating: {
      type: Number,
      default: 0,
    },
    verdict: {
      type: String,
      default: "TESTING",
    },
    programmingLanguage: {
      type: String,
      default: "",
    },
    timeConsumedMillis: {
      type: Number,
      default: 0,
    },
    memoryConsumedBytes: {
      type: Number,
      default: 0,
    },
    passedTestCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    sourceCode: {
      type: String,
      default: "",
    },
    creationTimeSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound ESR indexes (prefix rule covers handleLower equality lookups without a redundant single-field index)
SubmissionSchema.index({ handleLower: 1, contestId: 1 });
SubmissionSchema.index({ handleLower: 1, creationTimeSeconds: -1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
