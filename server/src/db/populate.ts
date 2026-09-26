import { ObjectId } from 'mongodb';
import {
  Camera,
  ChemicalBatch,
  FilmRoll,
  FilmStock,
  GenericChemical,
  collection,
} from './models';
import { withDefaults, type Doc, type Schema } from './schema';

/**
 * Replaces the id(s) at `path` on each doc with the referenced documents, in
 * one query. Matches Mongoose's populate: a single reference to a missing
 * document becomes null, missing entries drop out of arrays, and array order
 * is kept.
 */
export const populate = async (docs: Doc[], path: string, target: Schema): Promise<void> => {
  const ids = new Map<string, ObjectId>();
  for (const doc of docs) {
    const value = doc[path];
    for (const id of Array.isArray(value) ? value : [value]) {
      if (id instanceof ObjectId) ids.set(id.toHexString(), id);
    }
  }
  if (ids.size === 0) return;

  const found = await (await collection(target))
    .find({ _id: { $in: [...ids.values()] } })
    .toArray();
  const byId = new Map(found.map((doc) => [doc._id.toHexString(), withDefaults(target, doc)]));
  const lookup = (id: unknown) => (id instanceof ObjectId ? byId.get(id.toHexString()) : id);

  for (const doc of docs) {
    const value = doc[path];
    if (Array.isArray(value)) {
      doc[path] = value.map(lookup).filter((item) => item != null);
    } else if (value instanceof ObjectId) {
      doc[path] = lookup(value) ?? null;
    }
  }
};

/** A film roll with its stock, camera and batch, as the film roll routes return it. */
export const populateRolls = async (rolls: Doc[]): Promise<Doc[]> => {
  await Promise.all([
    populate(rolls, 'filmStock', FilmStock),
    populate(rolls, 'camera', Camera),
    populate(rolls, 'chemicalBatch', ChemicalBatch),
  ]);
  return rolls;
};

/** A one-shot batch with its chemicals, and its rolls with their stock and camera. */
export const populateOneShotBatches = async (batches: Doc[]): Promise<Doc[]> => {
  await Promise.all([
    populate(batches, 'developer', GenericChemical),
    populate(batches, 'fixer', GenericChemical),
    populate(batches, 'stopBath', GenericChemical),
    populate(batches, 'filmRolls', FilmRoll),
  ]);
  const rolls = batches.flatMap((batch) => (Array.isArray(batch.filmRolls) ? batch.filmRolls : []));
  await Promise.all([populate(rolls, 'filmStock', FilmStock), populate(rolls, 'camera', Camera)]);
  return batches;
};
