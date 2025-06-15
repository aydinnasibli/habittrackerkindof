'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserHabits } from './habits';
import { getOrCreateProfile } from './profile';
import { generatePersonalizedRecommendations, AIRecommendedHabit } from '@/lib/services/openai-service';
import { getCachedRecommendations, setCachedRecommendations } from '@/lib/services/recommendation-cache';

export async function getAIRecommendations(
    section: 'for-you' | 'trending' | 'new-habits'
): Promise<AIRecommendedHabit[]> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('User not authenticated');

        // Check cache first
        const cached = await getCachedRecommendations(userId, section);
        if (cached && cached.length > 0) {
            return cached;
        }

        // Fetch user data
        const [userHabits, profile] = await Promise.all([
            getUserHabits(),
            getOrCreateProfile()
        ]);

        if (!profile) throw new Error('Profile not found');

        // Generate new recommendations
        const recommendations = await generatePersonalizedRecommendations(
            userHabits,
            profile,
            section
        );

        // Cache the results
        if (recommendations.length > 0) {
            await setCachedRecommendations(userId, section, recommendations);
        }

        return recommendations;
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        // Return empty array to let component handle fallback
        return [];
    }
}

// Optional: Force refresh recommendations (e.g., after completing many habits)
export async function refreshAIRecommendations(): Promise<void> {
    try {
        const { userId } = await auth();
        if (!userId) return;

        const { invalidateUserCache } = await import('@/lib/services/recommendation-cache');
        await invalidateUserCache(userId);
    } catch (error) {
        console.error('Error refreshing recommendations:', error);
    }
}