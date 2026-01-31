import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOneShotChemicalBatch extends Document {
  developer: Types.ObjectId;
  fixer: Types.ObjectId;
  stopBath?: Types.ObjectId;
  developedAt?: Date;
  filmRolls?: Types.ObjectId[];
  notes?: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const oneShotChemicalBatchSchema = new Schema<IOneShotChemicalBatch>(
  {
    developer: {
      type: Schema.Types.ObjectId,
      ref: 'GenericChemical',
      required: true,
      validate: {
        validator: async function(id: Types.ObjectId) {
          const GenericChemical = mongoose.model('GenericChemical');
          const chemical = await GenericChemical.findById(id);
          return chemical?.type === 'developer';
        },
        message: 'Referenced chemical must be of type "developer"'
      }
    },
    fixer: {
      type: Schema.Types.ObjectId,
      ref: 'GenericChemical',
      required: true,
      validate: {
        validator: async function(id: Types.ObjectId) {
          const GenericChemical = mongoose.model('GenericChemical');
          const chemical = await GenericChemical.findById(id);
          return chemical?.type === 'fixer' || chemical?.type === 'other';
        },
        message: 'Referenced chemical must be of type "fixer"'
      }
    },
    stopBath: {
      type: Schema.Types.ObjectId,
      ref: 'GenericChemical',
      validate: {
        validator: async function(id: Types.ObjectId) {
          const GenericChemical = mongoose.model('GenericChemical');
          const chemical = await GenericChemical.findById(id);
          return chemical?.type === 'stopBath' || chemical?.type === 'other';
        },
        message: 'Referenced chemical must be of type "stopBath"'
      }
    },
    developedAt: {
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
    filmRolls: [{
      type: Schema.Types.ObjectId,
      ref: 'FilmRoll',
    }],
  },
  {
    timestamps: true,
  }
);

// Index for querying user's one-shot chemical batches
oneShotChemicalBatchSchema.index({ user: 1 });

export const OneShotChemicalBatch = mongoose.model<IOneShotChemicalBatch>('OneShotChemicalBatch', oneShotChemicalBatchSchema);  