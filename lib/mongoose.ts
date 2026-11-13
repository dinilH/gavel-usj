import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  _gavelMongooseCache?: MongooseCache;
};

const cached =
  globalWithMongoose._gavelMongooseCache ??
  (globalWithMongoose._gavelMongooseCache = {
    conn: null,
    promise: null,
  });

export default async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      'Missing environment variable: "MONGODB_URI". Add it to your .env file to use the Table Topics voter.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
