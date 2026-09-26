import type { Collection, Db, IndexDescription, ObjectId } from 'mongodb';
import { getDb } from '../config/database';
import type { Doc, Schema } from './schema';

/*
 * The app's collections, described field for field as the Mongoose models were.
 * Collection names are the ones Mongoose derived from the model names, so these
 * read and write the existing data.
 */

const FORMATS = ['35mm', '120', '4x5', '8x10', 'other'] as const;

export const User: Schema = {
  modelName: 'User',
  collection: 'users',
  fields: {
    email: { type: 'string', required: 'Email is required', lowercase: true, trim: true },
    password: {
      type: 'string',
      required: 'Password is required',
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: { type: 'string', required: 'Name is required', trim: true },
  },
};

export const Camera: Schema = {
  modelName: 'Camera',
  collection: 'cameras',
  fields: {
    make: { type: 'string', required: 'Camera make is required', trim: true },
    name: { type: 'string', required: 'Camera name is required', trim: true },
    format: { type: 'string', trim: true, enum: FORMATS },
    notes: { type: 'string', trim: true },
    user: { type: 'objectId', required: true },
  },
};

export const FilmStock: Schema = {
  modelName: 'FilmStock',
  collection: 'filmstocks',
  fields: {
    make: { type: 'string', required: 'Film make is required', trim: true },
    name: { type: 'string', required: 'Film name is required', trim: true },
    iso: { type: 'number', min: [1, 'ISO must be positive'] },
    format: { type: 'string', trim: true, enum: FORMATS },
    type: { type: 'string', trim: true, enum: ['color', 'bw', 'slide'] },
    user: { type: 'objectId', required: true },
  },
};

export const FilmRoll: Schema = {
  modelName: 'FilmRoll',
  collection: 'filmrolls',
  fields: {
    filmStock: { type: 'objectId', required: 'Film stock is required' },
    camera: { type: 'objectId', default: null },
    chemicalBatch: { type: 'objectId', default: null },
    dateLoaded: { type: 'date' },
    dateFinished: { type: 'date' },
    frameCount: { type: 'number', default: 36, min: [1, 'Frame count must be at least 1'] },
    status: { type: 'string', enum: ['loaded', 'shot', 'developed', 'scanned'], default: 'loaded' },
    notes: { type: 'string', trim: true },
    user: { type: 'objectId', required: true },
    countAsFullRoll: { type: 'boolean', default: true },
  },
};

export const ChemicalBatch: Schema = {
  modelName: 'ChemicalBatch',
  collection: 'chemicalbatches',
  fields: {
    name: { type: 'string', required: 'Batch name is required', trim: true },
    description: { type: 'string', trim: true },
    chemicalType: {
      type: 'string',
      required: 'Chemical type is required',
      enum: ['C41', 'E6', 'BW', 'Other'],
    },
    status: { type: 'string', enum: ['in-use', 'exhausted', 'archived'], default: 'in-use' },
    notes: { type: 'string', trim: true },
    deletedAt: { type: 'date', default: null },
    user: { type: 'objectId', required: true },
  },
};

export const GenericChemical: Schema = {
  modelName: 'GenericChemical',
  collection: 'genericchemicals',
  fields: {
    name: { type: 'string', required: 'Chemical name is required', trim: true },
    ratio: { type: 'string', trim: true }, // "1:100", "1:50", etc.
    type: {
      type: 'string',
      required: 'Chemical type is required',
      trim: true,
      enum: ['developer', 'fixer', 'stopBath', 'other'],
    },
    expirationDate: { type: 'date' },
    notes: { type: 'string', trim: true },
    user: { type: 'objectId', required: true },
  },
};

/** Checks that a referenced chemical exists and has one of the given types. */
const chemicalOfType =
  (...types: string[]) =>
  async (id: ObjectId | null): Promise<boolean> => {
    if (id == null) return false;
    const chemical = await (await collection(GenericChemical)).findOne({ _id: id });
    return types.includes(chemical?.type);
  };

export const OneShotChemicalBatch: Schema = {
  modelName: 'OneShotChemicalBatch',
  collection: 'oneshotchemicalbatches',
  fields: {
    developer: {
      type: 'objectId',
      required: true,
      validate: {
        validator: chemicalOfType('developer'),
        message: 'Referenced chemical must be of type "developer"',
      },
    },
    fixer: {
      type: 'objectId',
      required: true,
      validate: {
        validator: chemicalOfType('fixer', 'other'),
        message: 'Referenced chemical must be of type "fixer"',
      },
    },
    stopBath: {
      type: 'objectId',
      validate: {
        validator: chemicalOfType('stopBath', 'other'),
        message: 'Referenced chemical must be of type "stopBath"',
      },
    },
    developedAt: { type: 'date' },
    notes: { type: 'string', trim: true },
    user: { type: 'objectId', required: true },
    filmRolls: { type: 'objectIdArray' },
  },
};

export const collection = async (schema: Schema): Promise<Collection<Doc>> =>
  (await getDb()).collection<Doc>(schema.collection);

const INDEXES: Array<[Schema, IndexDescription[]]> = [
  [User, [{ key: { email: 1 }, unique: true }]],
  [Camera, [{ key: { user: 1 } }]],
  [FilmStock, [{ key: { user: 1 } }]],
  [FilmRoll, [{ key: { user: 1 } }, { key: { user: 1, status: 1 } }]],
  [ChemicalBatch, [{ key: { user: 1, deletedAt: 1 } }]],
  [GenericChemical, [{ key: { name: 1, ratio: 1, user: 1 }, unique: true }]],
  [OneShotChemicalBatch, [{ key: { user: 1 } }]],
];

/**
 * Creates the indexes Mongoose used to create on startup. A no-op when they
 * already exist. The unique ones back the "already registered" and duplicate
 * chemical responses, so a fresh database needs them.
 */
export const ensureIndexes = async (db: Db): Promise<void> => {
  await Promise.all(
    INDEXES.map(async ([schema, indexes]) => {
      try {
        await db.collection(schema.collection).createIndexes(indexes);
      } catch (error) {
        console.error(`⚠️  Could not create indexes on ${schema.collection}:`, error);
      }
    })
  );
};
