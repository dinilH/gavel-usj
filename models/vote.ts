import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IVote extends Document {
  tableTopic: Types.ObjectId;
  pin: string;
  first: string;
  second: string;
  third: string;
  mostImproved: string;
  votedAt: Date;
  voterName?: string;
  source: "self" | "admin";
}

const VoteSchema = new Schema<IVote>(
  {
    tableTopic: {
      type: Schema.Types.ObjectId,
      ref: "TableTopic",
      required: true,
    },
    pin: {
      type: String,
      required: true,
      trim: true,
    },
    first: { type: String, required: true, trim: true },
    second: { type: String, required: true, trim: true },
    third: { type: String, required: true, trim: true },
    mostImproved: { type: String, required: true, trim: true },
    votedAt: { type: Date, default: Date.now },
    voterName: { type: String, trim: true },
    source: {
      type: String,
      enum: ["self", "admin"],
      default: "self",
    },
  },
  {
    timestamps: false,
  }
);

VoteSchema.index({ tableTopic: 1, votedAt: -1 });

export const Vote: Model<IVote> =
  (mongoose.models.Vote as Model<IVote>) ||
  mongoose.model<IVote>("Vote", VoteSchema);
