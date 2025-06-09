// lib/mongoose.ts
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Improved global cache with connection state tracking
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    isConnecting: boolean;
}

let cached: MongooseCache = (global as any).mongoose || {
    conn: null,
    promise: null,
    isConnecting: false
};

if (!cached) {
    cached = { conn: null, promise: null, isConnecting: false };
    (global as any).mongoose = cached;
}

export async function connectToDatabase() {
    // Return existing connection immediately if available
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // If already connecting, wait for that promise
    if (cached.isConnecting && cached.promise) {
        return cached.promise;
    }

    // Reset stale connections
    if (mongoose.connection.readyState === 3) { // disconnecting
        await mongoose.disconnect();
    }

    // Create new connection
    if (!cached.promise || mongoose.connection.readyState === 0) {
        cached.isConnecting = true;

        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 3000, // Reduced from 5000
            socketTimeoutMS: 20000, // Reduced from 45000
            connectTimeoutMS: 10000,
            family: 4,
            maxIdleTimeMS: 30000,
            // Connection pooling optimizations
            minPoolSize: 2,
            retryWrites: true,
            w: 'majority' as const,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts)
            .then((mongoose) => {
                cached.isConnecting = false;
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ MongoDB connected successfully');
                }
                return mongoose;
            })
            .catch((e) => {
                cached.isConnecting = false;
                cached.promise = null;
                console.error('❌ MongoDB connection failed:', e);
                throw e;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        cached.isConnecting = false;
        throw e;
    }

    return cached.conn;
}

// Ultra-fast connection check - avoid unnecessary connection attempts
export async function ensureConnection() {
    const readyState = mongoose.connection.readyState;

    // 1 = connected, immediately return
    if (readyState === 1) {
        return mongoose.connection;
    }

    // 2 = connecting, wait for existing connection
    if (readyState === 2 && cached.promise) {
        await cached.promise;
        return mongoose.connection;
    }

    // Otherwise establish new connection
    await connectToDatabase();
    return mongoose.connection;
}