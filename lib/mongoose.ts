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
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    try {
        cached.conn = await cached.promise;
        console.log('✅ MongoDB connected successfully');
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB connection failed:', e);
        throw e;
    }

    return cached.conn;
}

// Alternative: Check if already connected before attempting connection
export async function ensureConnection() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
        console.log('✅ Already connected to MongoDB');
    }
    return await connectToDatabase();
    console.log('🔄 Attempting to connect to MongoDB via ensure');

}