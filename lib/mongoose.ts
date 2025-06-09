// lib/mongoose.ts
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Global cache for connection
let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
    // Return existing connection if available
    if (cached.conn) {
        return cached.conn;
    }

    // If no connection promise exists, create one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    try {
        cached.conn = await cached.promise;
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ MongoDB connected successfully');
        }
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB connection failed:', e);
        throw e;
    }

    return cached.conn;
}

// Optimized connection check
export async function ensureConnection() {
    if (mongoose.connection.readyState === 1) {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Already connected to MongoDB');
        }
        return mongoose.connection;
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Attempting to connect to MongoDB');
    }
    return await connectToDatabase();
}