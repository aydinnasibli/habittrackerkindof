// lib/actions/analytics.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserHabits } from './habits';
import { getOrCreateProfile } from './profile';
import { generateAnalytics, EnhancedAnalyticsData } from '@/lib/services/analytics-generator';
import { AnalyticsCache } from '@/lib/services/redis-cache';

export async function getAnalytics(forceRefresh: boolean = false): Promise<EnhancedAnalyticsData | null> {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const [habits, profile] = await Promise.all([
            getUserHabits(),
            getOrCreateProfile()
        ]);

        if (habits.length === 0) {
            return null;
        }

        return await generateAnalytics(userId, habits, profile, forceRefresh);
    } catch (error) {
        console.error('Error getting analytics:', error);
        throw error;
    }
}

export async function refreshAnalytics(): Promise<EnhancedAnalyticsData | null> {
    return getAnalytics(true);
}

export async function invalidateAnalyticsCache(): Promise<void> {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('Unauthorized');
        }

        await AnalyticsCache.invalidate(userId);
    } catch (error) {
        console.error('Error invalidating analytics cache:', error);
        throw error;
    }
}