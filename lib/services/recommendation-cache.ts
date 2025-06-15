import { Redis } from '@upstash/redis';
import { AIRecommendedHabit } from './openai-service';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const CACHE_PREFIX = 'habit_recommendations';

export async function getCachedRecommendations(
    userId: string,
    section: string
): Promise<AIRecommendedHabit[] | null> {
    try {
        const key = `${CACHE_PREFIX}:${userId}:${section}`;
        const cached = await redis.get<AIRecommendedHabit[]>(key);
        return cached;
    } catch (error) {
        console.error('Cache fetch error:', error);
        return null;
    }
}

export async function setCachedRecommendations(
    userId: string,
    section: string,
    recommendations: AIRecommendedHabit[]
): Promise<void> {
    try {
        const key = `${CACHE_PREFIX}:${userId}:${section}`;
        await redis.set(key, recommendations, { ex: CACHE_TTL });
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

export async function invalidateUserCache(userId: string): Promise<void> {
    try {
        const sections = ['for-you', 'trending', 'new-habits'];
        await Promise.all(
            sections.map(section =>
                redis.del(`${CACHE_PREFIX}:${userId}:${section}`)
            )
        );
    } catch (error) {
        console.error('Cache invalidation error:', error);
    }
}