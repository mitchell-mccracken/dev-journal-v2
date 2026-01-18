import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOneShotDeveloper extends Document {
  name: string;
  ratio?: string;     // "1:100", "1:50", etc.
  type: string;
  expirationDate?: Date;
  notes?: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const genericChemicalTypes = ['developer', 'fixer', 'stopBath', 'other'];

const genericChemicalSchema = new Schema<IOneShotDeveloper>(
  {
    name: {
      type: String,
      required: [true, 'Chemical name is required'],
      trim: true,
    },
    ratio: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Chemical type is required'],
      trim: true,
      enum: genericChemicalTypes,
    },
    expirationDate: {
      type: Date,
      required: false,
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

// Create compound index for uniqueness of name + ratio per user
genericChemicalSchema.index({ name: 1, ratio: 1, user: 1 }, { unique: true });

const GenericChemical = mongoose.model<IOneShotDeveloper>('GenericChemical', genericChemicalSchema);

export { GenericChemical };