import mongoose, { Document, Model, Schema } from "mongoose";

export type TableTopicSpeaker = {
  name: string;
  points: number;
};

export interface ITableTopic extends Document {
  meeting_num: number;
  pin: string;
  speakers: TableTopicSpeaker[];
  date: Date;
  createdBy: string;
  isCollecting: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TableTopicSchema = new Schema<ITableTopic>(
  {
    meeting_num: { type: Number, required: true, unique: true },
    pin: { type: String, required: true, unique: true },
    speakers: [
      {
        name: { type: String, required: true, trim: true },
        points: { type: Number, required: true, default: 0, min: 0 },
      },
    ],
    date: { type: Date, required: true },
    createdBy: { type: String, required: true, trim: true },
    isCollecting: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  }
);

export const TableTopic: Model<ITableTopic> =
  (mongoose.models.TableTopic as Model<ITableTopic>) ||
  mongoose.model<ITableTopic>("TableTopic", TableTopicSchema);
