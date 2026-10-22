import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  failed: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongooseCache || {
  conn: null,
  promise: null,
  failed: false,
};

globalThis.__mongooseCache = cached;

export async function connectToMongo(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (cached.failed) {
    return null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 3000,
      })
      .then((m) => m)
      .catch((err) => {
        console.warn('[MercaDónde DB] MongoDB connection fallback to Local NoSQL Store:', err?.message);
        cached.failed = true;
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
