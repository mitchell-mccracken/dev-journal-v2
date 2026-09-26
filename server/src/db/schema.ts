import { ObjectId } from 'mongodb';

/*
 * A small stand-in for the parts of Mongoose this app relied on: casting
 * request values to their stored types, schema defaults, timestamps and
 * validation. The rules are copied from Mongoose 8 (lib/cast/*.js and the
 * validators in lib/schema/*.js) so that documents written here match the ones
 * Mongoose wrote, and requests get the same answers they always did.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = Record<string, any>;

type Default<T> = T | null | (() => T | null);

interface FieldBase {
  /** true, or the message to report when missing. */
  required?: true | string;
}

export interface StringField extends FieldBase {
  type: 'string';
  trim?: boolean;
  lowercase?: boolean;
  enum?: readonly string[];
  minlength?: [number, string];
  default?: Default<string>;
}

export interface NumberField extends FieldBase {
  type: 'number';
  min?: [number, string];
  default?: Default<number>;
}

export interface DateField extends FieldBase {
  type: 'date';
  default?: Default<Date>;
}

export interface BooleanField extends FieldBase {
  type: 'boolean';
  default?: Default<boolean>;
}

export interface ObjectIdField extends FieldBase {
  type: 'objectId';
  default?: Default<ObjectId>;
  /** Runs on every value except undefined -- null included, as in Mongoose. */
  validate?: { validator: (value: ObjectId | null) => Promise<boolean>; message: string };
}

/** Defaults to [] when missing, as Mongoose array paths do. */
export interface ObjectIdArrayField {
  type: 'objectIdArray';
}

export type Field =
  | StringField
  | NumberField
  | DateField
  | BooleanField
  | ObjectIdField
  | ObjectIdArrayField;

export interface Schema {
  /** Used in validation messages, e.g. "FilmRoll validation failed: ...". */
  modelName: string;
  /** The collection Mongoose created for this model. */
  collection: string;
  fields: Record<string, Field>;
}

export class CastError extends Error {
  name = 'CastError';

  constructor(kind: string, value: unknown, path: string, reason?: string) {
    const type = value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value;
    super(
      `Cast to ${kind} failed for value ${JSON.stringify(value)} (type ${type}) at path "${path}"` +
        (reason ? ` because of "${reason}"` : '')
    );
  }
}

export class ValidationError extends Error {
  name = 'ValidationError';

  constructor(prefix: string, errors: Array<[path: string, message: string]>) {
    super(`${prefix}: ${errors.map(([path, message]) => `${path}: ${message}`).join(', ')}`);
  }
}

const TRUE_VALUES = new Set<unknown>([true, 'true', 1, '1', 'yes']);
const FALSE_VALUES = new Set<unknown>([false, 'false', 0, '0', 'no']);

const castString = (value: unknown, path: string): string | null | undefined => {
  if (value == null) return value;
  if (typeof value === 'string') return value;
  if (
    !Array.isArray(value) &&
    typeof (value as { toString?: unknown }).toString === 'function' &&
    (value as object).toString !== Object.prototype.toString
  ) {
    return String(value);
  }
  throw new CastError('string', value, path);
};

const castNumber = (value: unknown, path: string): number | null | undefined => {
  if (value == null) return value;
  if (value === '') return null;
  const n = typeof value === 'string' || typeof value === 'boolean' ? Number(value) : value;
  if (typeof n === 'number' && !isNaN(n)) return n;
  throw new CastError('Number', value, path);
};

const castDate = (value: unknown, path: string): Date | null => {
  if (value == null || value === '') return null;
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    // A numeric string far outside the year range is milliseconds, not a year.
    const n = Number(value);
    date = !isNaN(n) && (n >= 275761 || n < -271820) ? new Date(n) : new Date(value);
  } else {
    throw new CastError('date', value, path);
  }
  if (isNaN(date.valueOf())) throw new CastError('date', value, path);
  return date;
};

const castBoolean = (value: unknown, path: string): boolean | null | undefined => {
  if (TRUE_VALUES.has(value)) return true;
  if (FALSE_VALUES.has(value)) return false;
  if (value == null) return value;
  throw new CastError('Boolean', value, path);
};

const castObjectId = (value: unknown, path: string): ObjectId | null | undefined => {
  if (value == null) return value;
  if (value instanceof ObjectId) return value;
  // A populated document stands in for its own id.
  const id = (value as { _id?: unknown })._id;
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(String(id ?? value));
  } catch {
    throw new CastError('ObjectId', value, path, 'BSONError');
  }
};

const castField = (field: Field, value: unknown, path: string): unknown => {
  if (value === undefined) return undefined;
  switch (field.type) {
    case 'string': {
      let s = castString(value, path);
      if (typeof s === 'string') {
        if (field.lowercase) s = s.toLowerCase();
        if (field.trim) s = s.trim();
      }
      return s;
    }
    case 'number':
      return castNumber(value, path);
    case 'date':
      return castDate(value, path);
    case 'boolean':
      return castBoolean(value, path);
    case 'objectId':
      return castObjectId(value, path);
    case 'objectIdArray': {
      if (value === null) return null;
      const items = Array.isArray(value) ? value : [value];
      return items.map((item, i) => castObjectId(item, `${path}.${i}`));
    }
  }
};

/** Casts one query value the way Mongoose casts a filter, setters included. */
export const castValue = (schema: Schema, path: string, value: unknown): unknown =>
  castField(schema.fields[path], value, path);

const defaultFor = (field: Field): unknown => {
  if (field.type === 'objectIdArray') return [];
  if (!('default' in field)) return undefined;
  return typeof field.default === 'function' ? field.default() : field.default;
};

/** The synchronous validators, in Mongoose's order. Null means it passed. */
const checkField = (field: Field, value: unknown, path: string): string | null => {
  if (field.type === 'objectIdArray') return null;

  if (field.required) {
    const present =
      field.type === 'string' ? typeof value === 'string' && value.length > 0 : value != null;
    if (!present) {
      return typeof field.required === 'string' ? field.required : `Path \`${path}\` is required.`;
    }
  }
  if (value == null) return null;

  if (field.type === 'string') {
    const s = value as string;
    if (field.enum && !field.enum.includes(s)) {
      return `\`${s}\` is not a valid enum value for path \`${path}\`.`;
    }
    if (field.minlength && s.length < field.minlength[0]) return field.minlength[1];
  }
  if (field.type === 'number' && field.min && (value as number) < field.min[0]) {
    return field.min[1];
  }
  return null;
};

/**
 * Validates the given paths of `doc`. Like Mongoose, synchronous failures are
 * reported before the async (database-backed) ones, each in schema order.
 */
const validatePaths = async (
  schema: Schema,
  doc: Doc,
  paths: string[]
): Promise<Array<[string, string]>> => {
  const syncErrors: Array<[string, string]> = [];
  const pending: Array<Promise<[string, string] | null>> = [];

  for (const path of paths) {
    const field = schema.fields[path];
    const value = doc[path];
    const message = checkField(field, value, path);
    if (message) {
      syncErrors.push([path, message]);
    } else if (field.type === 'objectId' && field.validate && value !== undefined) {
      const { validator, message: failure } = field.validate;
      pending.push(validator(value).then((ok) => (ok ? null : [path, failure])));
    }
  }

  const asyncErrors = (await Promise.all(pending)).filter(
    (error): error is [string, string] => error !== null
  );
  return [...syncErrors, ...asyncErrors];
};

/**
 * A new document from request input: defaults filled in, values cast, all
 * paths validated, timestamps and `__v` set -- what `Model.create` stored.
 * Throws ValidationError, cast failures included, as Mongoose does on create.
 */
export const buildInsert = async (schema: Schema, input: Doc): Promise<Doc> => {
  const doc: Doc = {};
  const castErrors: Array<[string, string]> = [];

  for (const [path, field] of Object.entries(schema.fields)) {
    const value = input[path] === undefined ? defaultFor(field) : input[path];
    try {
      const casted = castField(field, value, path);
      if (casted !== undefined) doc[path] = casted;
    } catch (error) {
      castErrors.push([path, (error as Error).message]);
    }
  }

  const failed = new Set(castErrors.map(([path]) => path));
  const paths = Object.keys(schema.fields).filter((path) => !failed.has(path));
  const errors = [...castErrors, ...(await validatePaths(schema, doc, paths))];
  if (errors.length) throw new ValidationError(`${schema.modelName} validation failed`, errors);

  const now = new Date();
  return { _id: new ObjectId(), ...doc, createdAt: now, updatedAt: now, __v: 0 };
};

/**
 * A `$set` update from request input, as `findOneAndUpdate` with
 * `runValidators` built it: undefined values are left out, the rest are cast
 * and validated, and `updatedAt` is bumped. Cast failures throw CastError;
 * validation failures throw ValidationError.
 */
export const buildUpdate = async (schema: Schema, input: Doc): Promise<{ $set: Doc }> => {
  const set: Doc = {};
  for (const [path, value] of Object.entries(input)) {
    const field = schema.fields[path];
    if (!field || value === undefined) continue;
    set[path] = castField(field, value, path);
  }

  const errors = await validatePaths(schema, set, Object.keys(set));
  if (errors.length) throw new ValidationError('Validation failed', errors);

  return { $set: { ...set, updatedAt: new Date() } };
};

/**
 * A stored document as Mongoose handed it back: defaults filled in for paths
 * the document predates (e.g. countAsFullRoll on older rolls).
 */
export const withDefaults = <T extends Doc>(schema: Schema, doc: T): T => {
  for (const [path, field] of Object.entries(schema.fields)) {
    if (doc[path] !== undefined) continue;
    const value = defaultFor(field);
    if (value !== undefined) (doc as Doc)[path] = value;
  }
  return doc;
};
