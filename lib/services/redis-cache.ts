// lib/services/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class AnalyticsCache {
    private static getKey(userId: string, type: string): string {
        return `analytics:${userId}:${type}`;
    }

    private static getHashKey(userId: string): string {
        return `analytics:hash:${userId}`;
    }

    static async get<T>(userId: string, type: string): Promise<T | null> {
        try {
            const key = this.getKey(userId, type);
            const data = await redis.get(key);
            return data as T;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    static async set(userId: string, type: string, data: any, ttl: number = 3600): Promise<void> {
        try {
            const key = this.getKey(userId, type);
            await redis.setex(key, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    static async getDataHash(userId: string): Promise<string | null> {
        try {
            const key = this.getHashKey(userId);
            return await redis.get(key);
        } catch (error) {
            console.error('Redis hash get error:', error);
            return null;
        }
    }

    static async setDataHash(userId: string, hash: string): Promise<void> {
        try {
            const key = this.getHashKey(userId);
            await redis.setex(key, 3600, hash); // 1 hour TTL
        } catch (error) {
            console.error('Redis hash set error:', error);
        }
    }

    static async invalidate(userId: string): Promise<void> {
        try {
            const pattern = `analytics:${userId}:*`;
            // Note: In production, you might want to use SCAN instead of KEYS
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            await redis.del(this.getHashKey(userId));
        } catch (error) {
            console.error('Redis invalidate error:', error);
        }
    }
}