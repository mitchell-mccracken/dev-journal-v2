import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChemicalBatch extends Document {
  name: string;
  description?: string;
  chemicalType: string;
  status: string;
  notes?: string;
  deletedAt?: Date;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chemicalBatchSchema = new Schema<IChemicalBatch>(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    chemicalType: {
      type: String,
      required: [true, 'Chemical type is required'],
      enum: ['C41', 'E6', 'BW', 'Other'],
    },
    status: {
      type: String,
      enum: ['in-use', 'exhausted', 'archived'],
      default: 'in-use',
    },
    notes: {
      type: String,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
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

// Index for querying user's batches (excluding soft-deleted)
chemicalBatchSchema.index({ user: 1, deletedAt: 1 });

// Helper method to check if soft-deleted
chemicalBatchSchema.methods.isDeleted = function (): boolean {
  return this.deletedAt !== null;
};

// Soft delete method
chemicalBatchSchema.methods.softDelete = async function (): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

export const ChemicalBatch = mongoose.model<IChemicalBatch>('ChemicalBatch', chemicalBatchSchema);
