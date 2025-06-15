import { Redis } from '@upstash/redis';
import { AIRecommendedHabit } from './openai-service';
import { getWeekNumber } from '@/lib/utils/date-utils';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache keys include week number for automatic weekly refresh
const CACHE_TTL = 3 * 24 * 60 * 60; // 3 days (shorter than weekly refresh)
const CACHE_PREFIX = 'habit_recs_v2';

function getCacheKey(userId: string, section: string): string {
    const weekNumber = getWeekNumber(new Date());
    return `${CACHE_PREFIX}:${userId}:${section}:w${weekNumber}`;
}

export async function getCachedRecommendations(
    userId: string,
    section: string
): Promise<AIRecommendedHabit[] | null> {
    try {
        const key = getCacheKey(userId, section);
        const cached = await redis.get<{
            recommendations: AIRecommendedHabit[];
            generatedAt: string;
            weekNumber: number;
        }>(key);

        if (cached) {
            const currentWeek = getWeekNumber(new Date());
            // Auto-invalidate if week has changed
            if (cached.weekNumber !== currentWeek) {
                await redis.del(key);
                return null;
            }
            return cached.recommendations;
        }

        return null;
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
        const key = getCacheKey(userId, section);
        const data = {
            recommendations,
            generatedAt: new Date().toISOString(),
            weekNumber: getWeekNumber(new Date())
        };

        await redis.set(key, data, { ex: CACHE_TTL });

        // Also set user's last generation time for rate limiting
        await redis.set(
            `${CACHE_PREFIX}:${userId}:last_gen`,
            Date.now(),
            { ex: 24 * 60 * 60 } // 24 hours
        );
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

// Rate limiting for AI requests
export async function canGenerateRecommendations(userId: string): Promise<boolean> {
    try {
        const lastGeneration = await redis.get(`${CACHE_PREFIX}:${userId}:last_gen`);
        if (!lastGeneration) return true;

        const hoursSinceLastGen = (Date.now() - Number(lastGeneration)) / (1000 * 60 * 60);
        return hoursSinceLastGen >= 6; // Allow new generation every 6 hours
    } catch {
        return true; // Allow on error
    }
}