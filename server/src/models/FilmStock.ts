import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFilmStock extends Document {
  make: string;
  name: string;
  iso?: number;
  format?: string;
  type?: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const filmStockSchema = new Schema<IFilmStock>(
  {
    make: {
      type: String,
      required: [true, 'Film make is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Film name is required'],
      trim: true,
    },
    iso: {
      type: Number,
      min: [1, 'ISO must be positive'],
    },
    format: {
      type: String,
      trim: true,
      enum: ['35mm', '120', '4x5', '8x10', 'other'],
    },
    type: {
      type: String,
      trim: true,
      enum: ['color', 'bw', 'slide'],
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

// Index for querying user's film stocks
filmStockSchema.index({ user: 1 });

export const FilmStock = mongoose.model<IFilmStock>('FilmStock', filmStockSchema);
