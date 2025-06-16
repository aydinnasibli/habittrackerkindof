// lib/actions/ai-analytics.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { AdvancedHabitAI, ComprehensiveAnalysis } from '@/lib/services/habit-analytics-ai';
import { getUserHabits } from './habits';
import { getOrCreateProfile } from './profile';

export async function getAIAnalytics(): Promise<ComprehensiveAnalysis | null> {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const [habits, profile] = await Promise.all([
            getUserHabits(),
            getOrCreateProfile()
        ]);

        if (!profile) {
            throw new Error('Profile not found');
        }

        if (habits.length === 0) {
            return null;
        }

        const aiService = new AdvancedHabitAI();
        const analysis = await aiService.generateComprehensiveAnalysis(habits, profile);

        return analysis;
    } catch (error) {
        console.error('Error getting AI analytics:', error);
        throw error;
    }
}

export async function refreshAIAnalytics(): Promise<ComprehensiveAnalysis | null> {
    // Same as getAIAnalytics but can be used for explicit refresh
    return getAIAnalytics();
}