'use server';

import { auth } from '@clerk/nextjs/server';
import { OptimizedHabitAI, OptimizedAnalysis } from '@/lib/services/habit-analytics-ai';
import { getUserHabits } from './habits';
import { getOrCreateProfile } from './profile';
import { AnalyticsCache } from '@/lib/services/analytics-cache';

export async function getQuickAnalytics(): Promise<OptimizedAnalysis['quickStats'] | null> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        // Try cache first
        const cached = await AnalyticsCache.getQuickStats(userId);
        if (cached) return cached;

        // Generate quick stats (no AI, always fast)
        const habits = await getUserHabits();
        if (habits.length === 0) return null;

        const aiService = new OptimizedHabitAI();
        const quickStats = aiService.generateQuickStats(habits);

        // Cache with habits data for hash comparison
        await AnalyticsCache.setQuickStats(userId, { ...quickStats, habits });

        return quickStats;
    } catch (error) {
        console.error('Error getting quick analytics:', error);
        return null;
    }
}

export async function getFullAnalytics(forceRefresh: boolean = false): Promise<OptimizedAnalysis | null> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        // Check if already generating
        const status = await AnalyticsCache.getGenerationStatus(userId);
        if (status === 'generating' && !forceRefresh) {
            return { status: 'generating' } as any;
        }

        // Try cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = await AnalyticsCache.getFullAnalytics(userId);
            if (cached) {
                // Check if data is stale
                const habits = await getUserHabits();
                const shouldRegenerate = await AnalyticsCache.shouldRegenerate(userId, habits);

                if (!shouldRegenerate) {
                    return { ...cached, freshness: 'recent' };
                }

                // Return cached data but trigger background refresh
                generateAnalyticsInBackground(userId);
                return { ...cached, freshness: 'stale' };
            }
        }

        // Generate fresh analytics
        return await generateFreshAnalytics(userId);
    } catch (error) {
        console.error('Error getting full analytics:', error);
        throw error;
    }
}

async function generateFreshAnalytics(userId: string): Promise<OptimizedAnalysis> {
    // Set generation status
    await AnalyticsCache.setGenerationStatus(userId, 'generating');

    try {
        const [habits, profile] = await Promise.all([
            getUserHabits(),
            getOrCreateProfile()
        ]);

        if (!profile) throw new Error('Profile not found');
        if (habits.length === 0) return null;

        const aiService = new OptimizedHabitAI();
        const analysis = await aiService.generateOptimizedAnalysis(habits, profile);

        // Cache the result
        await Promise.all([
            AnalyticsCache.setFullAnalytics(userId, analysis),
            AnalyticsCache.setGenerationStatus(userId, 'completed')
        ]);

        return analysis;
    } catch (error) {
        await AnalyticsCache.setGenerationStatus(userId, 'failed');
        throw error;
    }
}

async function generateAnalyticsInBackground(userId: string) {
    // This could be improved with a proper job queue
    setTimeout(async () => {
        try {
            await generateFreshAnalytics(userId);
        } catch (error) {
            console.error('Background analytics generation failed:', error);
        }
    }, 1000);
}

export async function refreshAnalytics(): Promise<OptimizedAnalysis | null> {
    const { userId } = await auth();
    if (userId) {
        await AnalyticsCache.clearUserCache(userId);
    }
    return getFullAnalytics(true);
}

export async function getAnalyticsStatus(): Promise<string | null> {
    const { userId } = await auth();
    if (!userId) return null;

    return AnalyticsCache.getGenerationStatus(userId);
}