import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmission extends Document {
  handle: string;
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
      index: true,
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

// Compound index for efficient lookups by handle + contest
SubmissionSchema.index({ handle: 1, contestId: 1 });
SubmissionSchema.index({ handle: 1, creationTimeSeconds: -1 });

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
