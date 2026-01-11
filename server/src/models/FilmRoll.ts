import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFilmRoll extends Document {
  filmStock: Types.ObjectId;
  camera?: Types.ObjectId;
  chemicalBatch?: Types.ObjectId;
  dateLoaded?: Date;
  dateFinished?: Date;
  frameCount: number;
  status: string;
  notes?: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const filmRollSchema = new Schema<IFilmRoll>(
  {
    filmStock: {
      type: Schema.Types.ObjectId,
      ref: 'FilmStock',
      required: [true, 'Film stock is required'],
    },
    camera: {
      type: Schema.Types.ObjectId,
      ref: 'Camera',
      default: null,
    },
    chemicalBatch: {
      type: Schema.Types.ObjectId,
      ref: 'ChemicalBatch',
      default: null,
    },
    dateLoaded: {
      type: Date,
    },
    dateFinished: {
      type: Date,
    },
    frameCount: {
      type: Number,
      default: 36,
      min: [1, 'Frame count must be at least 1'],
    },
    status: {
      type: String,
      enum: ['loaded', 'shot', 'developed', 'scanned'],
      default: 'loaded',
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

// Index for querying user's film rolls
filmRollSchema.index({ user: 1 });
filmRollSchema.index({ user: 1, status: 1 });

export const FilmRoll = mongoose.model<IFilmRoll>('FilmRoll', filmRollSchema);
