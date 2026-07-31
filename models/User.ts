import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  handle: string;
  rating: number;
  rank: string;
  maxRating: number;
  maxRank: string;
  avatar: string;
  contribution: number;
  friendOfCount: number;
  organization: string;
  country: string;
  city: string;
  registrationTimeSeconds: number;
  lastOnlineTimeSeconds: number;
}

const UserSchema = new Schema<IUser>(
  {
    handle: {
      type: String,
      required: [true, "Codeforces handle is required"],
      unique: true,
      trim: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      default: "unrated",
    },
    maxRating: {
      type: Number,
      default: 0,
    },
    maxRank: {
      type: String,
      default: "unrated",
    },
    avatar: {
      type: String,
      default: "",
    },
    contribution: {
      type: Number,
      default: 0,
    },
    friendOfCount: {
      type: Number,
      default: 0,
    },
    organization: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    registrationTimeSeconds: {
      type: Number,
      default: 0,
    },
    lastOnlineTimeSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
