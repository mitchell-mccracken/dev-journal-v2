import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICamera extends Document {
  make: string;
  name: string;
  format?: string;
  notes?: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cameraSchema = new Schema<ICamera>(
  {
    make: {
      type: String,
      required: [true, 'Camera make is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Camera name is required'],
      trim: true,
    },
    format: {
      type: String,
      trim: true,
      enum: ['35mm', '120', '4x5', '8x10', 'other'],
    },
    notes: {
      type: String,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user's cameras
cameraSchema.index({ user: 1 });

export const Camera = mongoose.model<ICamera>('Camera', cameraSchema);
