import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tmuneebanjum:A5Y1enJBJcDVwPrt@jorn.nx9fd28.mongodb.net/smartsave';
const DB_NAME = 'trading-journal';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Mongoose connection (for existing code)
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Native MongoDB driver connection (for API routes)
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  const client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

// Connect to database function expected by API routes
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    console.log('Connected to MongoDB successfully, using database:', DB_NAME);
    const db = client.db(DB_NAME); 
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Export both for compatibility
export default connectDB;
export { connectDB }; 