// lib/services/analytics-cache.ts
import { Redis } from '@upstash/redis';
import { ComprehensiveAnalysis } from '@/lib/services/habit-analytics-ai';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class AnalyticsCache {
    private static readonly CACHE_KEYS = {
        FULL_ANALYTICS: (userId: string) => `analytics:full:${userId}`,
        QUICK_STATS: (userId: string) => `analytics:quick:${userId}`,
        HABITS_HASH: (userId: string) => `analytics:hash:${userId}`,
        GENERATION_STATUS: (userId: string) => `analytics:status:${userId}`,
    };

    private static readonly TTL = {
        QUICK_STATS: 5 * 60,        // 5 minutes
        FULL_ANALYTICS: 30 * 60,    // 30 minutes
        HABITS_HASH: 24 * 60 * 60,  // 24 hours
        STATUS: 60,                 // 1 minute
    };

    // Generate hash from habits to detect changes
    static generateHabitsHash(habits: any[]): string {
        const relevantData = habits.map(h => ({
            id: h._id,
            completions: h.completions?.slice(-30), // Last 30 days only
            streak: h.streak,
            status: h.status,
            updatedAt: h.updatedAt
        }));

        return Buffer.from(JSON.stringify(relevantData)).toString('base64').slice(0, 16);
    }

    // Check if analytics need regeneration
    static async shouldRegenerate(userId: string, currentHabits: any[]): Promise<boolean> {
        try {
            const currentHash = this.generateHabitsHash(currentHabits);
            const cachedHash = await redis.get(this.CACHE_KEYS.HABITS_HASH(userId));

            return currentHash !== cachedHash;
        } catch (error) {
            console.error('Error checking regeneration need:', error);
            return true; // Regenerate on error
        }
    }

    // Get quick stats (always fast)
    static async getQuickStats(userId: string) {
        try {
            return await redis.get(this.CACHE_KEYS.QUICK_STATS(userId));
        } catch (error) {
            console.error('Error getting quick stats:', error);
            return null;
        }
    }

    // Set quick stats
    static async setQuickStats(userId: string, stats: any) {
        try {
            await Promise.all([
                redis.setex(this.CACHE_KEYS.QUICK_STATS(userId), this.TTL.QUICK_STATS, JSON.stringify(stats)),
                redis.setex(this.CACHE_KEYS.HABITS_HASH(userId), this.TTL.HABITS_HASH, this.generateHabitsHash(stats.habits || []))
            ]);
        } catch (error) {
            console.error('Error setting quick stats:', error);
        }
    }

    // Get full analytics
    static async getFullAnalytics(userId: string): Promise<ComprehensiveAnalysis | null> {
        try {
            const data = await redis.get(this.CACHE_KEYS.FULL_ANALYTICS(userId));
            return data as ComprehensiveAnalysis;
        } catch (error) {
            console.error('Error getting full analytics:', error);
            return null;
        }
    }

    // Set full analytics
    static async setFullAnalytics(userId: string, analytics: ComprehensiveAnalysis) {
        try {
            await redis.setex(
                this.CACHE_KEYS.FULL_ANALYTICS(userId),
                this.TTL.FULL_ANALYTICS,
                JSON.stringify(analytics)
            );
        } catch (error) {
            console.error('Error setting full analytics:', error);
        }
    }

    // Generation status management
    static async setGenerationStatus(userId: string, status: 'generating' | 'completed' | 'failed') {
        try {
            await redis.setex(this.CACHE_KEYS.GENERATION_STATUS(userId), this.TTL.STATUS, status);
        } catch (error) {
            console.error('Error setting generation status:', error);
        }
    }

    static async getGenerationStatus(userId: string): Promise<string | null> {
        try {
            return await redis.get(this.CACHE_KEYS.GENERATION_STATUS(userId)) as string;
        } catch (error) {
            console.error('Error getting generation status:', error);
            return null;
        }
    }

    // Clear all analytics cache for user
    static async clearUserCache(userId: string) {
        try {
            await redis.del(
                this.CACHE_KEYS.FULL_ANALYTICS(userId),
                this.CACHE_KEYS.QUICK_STATS(userId),
                this.CACHE_KEYS.HABITS_HASH(userId),
                this.CACHE_KEYS.GENERATION_STATUS(userId)
            );
        } catch (error) {
            console.error('Error clearing user cache:', error);
        }
    }
}