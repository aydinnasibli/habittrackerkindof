'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserHabits } from './habits';
import { getOrCreateProfile } from './profile';
import { generatePersonalizedRecommendations, AIRecommendedHabit } from '@/lib/services/openai-service';
import {
    getCachedRecommendations,
    setCachedRecommendations,
    canGenerateRecommendations
} from '@/lib/services/recommendation-cache';

interface RecommendationResponse {
    recommendations: AIRecommendedHabit[];
    isFromCache: boolean;
    weeklyTheme: string;
    canRefresh: boolean;
    nextRefreshTime?: string;
}

export async function getAIRecommendations(
    section: 'for-you' | 'trending' | 'new-habits'
): Promise<RecommendationResponse> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        // Check if user can generate new recommendations
        const canGenerate = await canGenerateRecommendations(userId);

        // Try cache first
        const cached = await getCachedRecommendations(userId, section);
        if (cached && cached.length > 0) {
            return {
                recommendations: cached,
                isFromCache: true,
                weeklyTheme: cached[0]?.weeklyTheme || '',
                canRefresh: canGenerate
            };
        }

        // If no cache and can't generate, return fallback
        if (!canGenerate) {
            const fallback = await getIntelligentFallback(section, [], null);
            return {
                recommendations: fallback,
                isFromCache: false,
                weeklyTheme: 'Classic Essentials',
                canRefresh: false,
                nextRefreshTime: getNextRefreshTime()
            };
        }

        // Generate new recommendations
        const [userHabits, profile] = await Promise.all([
            getUserHabits(),
            getOrCreateProfile()
        ]);

        if (!profile) throw new Error('Profile not found');

        const recommendations = await generatePersonalizedRecommendations(
            userHabits,
            profile,
            section
        );

        // Cache the results
        if (recommendations.length > 0) {
            await setCachedRecommendations(userId, section, recommendations);
        }

        return {
            recommendations,
            isFromCache: false,
            weeklyTheme: recommendations[0]?.weeklyTheme || '',
            canRefresh: false // Just generated, so can't refresh immediately
        };

    } catch (error) {
        console.error('Error getting AI recommendations:', error);

        // Return intelligent fallback
        const fallback = await getIntelligentFallback(section, [], null);
        return {
            recommendations: fallback,
            isFromCache: false,
            weeklyTheme: 'Essential Habits',
            canRefresh: false
        };
    }
}

// Force refresh with user feedback
export async function refreshAIRecommendations(
    section: 'for-you' | 'trending' | 'new-habits',
    feedback?: 'not_relevant' | 'too_easy' | 'too_hard' | 'different_category'
): Promise<RecommendationResponse> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        // Log feedback for improving recommendations
        if (feedback) {
            await logUserFeedback(userId, section, feedback);
        }

        // Force cache invalidation
        await invalidateUserCache(userId);

        // Generate fresh recommendations
        return await getAIRecommendations(section);
    } catch (error) {
        console.error('Error refreshing recommendations:', error);
        throw error;
    }
}