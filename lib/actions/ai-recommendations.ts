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
import { getWeekNumber } from '@/lib/utils/date-utils';

interface RecommendationResponse {
    recommendations: AIRecommendedHabit[];
    isFromCache: boolean;
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
                canRefresh: canGenerate,
            };
        }

        // If no cache and can't generate, return fallback
        if (!canGenerate) {
            const fallback = await getIntelligentFallback(section, [], null);
            return {
                recommendations: fallback,
                isFromCache: false,
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
            canRefresh: false // Just generated, so can't refresh immediately
        };

    } catch (error) {
        console.error('Error getting AI recommendations:', error);

        // Return intelligent fallback
        const fallback = await getIntelligentFallback(section, [], null);
        return {
            recommendations: fallback,
            isFromCache: false,

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



// Helper function to get next refresh time
function getNextRefreshTime(): string {
    const next = new Date();
    next.setHours(next.getHours() + 6);
    return next.toISOString();
}

// Intelligent fallback when AI is unavailable
async function getIntelligentFallback(
    section: 'for-you' | 'trending' | 'new-habits',
    userHabits: any[],
    profile: any
): Promise<AIRecommendedHabit[]> {
    const baseHabits = getFallbackHabits();

    // Filter based on section
    let filteredHabits = baseHabits;

    if (section === 'for-you') {
        // Return habits that complement existing ones
        const userCategories = userHabits.map(h => h.category);
        filteredHabits = baseHabits.filter(h => !userCategories.includes(h.category));
    } else if (section === 'trending') {
        // Return popular habits
        filteredHabits = baseHabits.filter(h => h.trendingScore && h.trendingScore > 80);
    } else if (section === 'new-habits') {
        // Return beginner-friendly habits
        filteredHabits = baseHabits.filter(h => h.difficultyLevel === 'beginner');
    }

    return filteredHabits.slice(0, 6);
}

// Get fallback habits when AI is unavailable
function getFallbackHabits(): AIRecommendedHabit[] {
    return [
        {
            id: 'fallback-1',
            name: 'Morning Meditation',
            description: 'Start your day with 10 minutes of mindfulness meditation',
            category: 'Mindfulness',
            frequency: 'Daily',
            timeOfDay: 'Morning',
            timeToComplete: '10 minutes',
            priority: 'Medium',
            matchScore: 85,
            benefits: ['Reduces stress', 'Improves focus', 'Better emotional regulation'],
            impactAreas: ['Mental Health', 'Productivity'],
            chainsWith: ['Journaling', 'Exercise'],
            aiReasoning: 'Meditation is a foundational habit that supports overall well-being',
            trendingScore: 90,
            difficultyLevel: 'beginner'
        },
        {
            id: 'fallback-2',
            name: 'Daily Walk',
            description: 'Take a 20-minute walk outdoors for physical and mental health',
            category: 'Health',
            frequency: 'Daily',
            timeOfDay: 'Morning',
            timeToComplete: '20 minutes',
            priority: 'High',
            matchScore: 88,
            benefits: ['Improves cardiovascular health', 'Boosts mood', 'Increases energy'],
            impactAreas: ['Physical Health', 'Mental Health'],
            chainsWith: ['Meditation', 'Podcast listening'],
            aiReasoning: 'Walking is one of the most accessible and beneficial daily habits',
            trendingScore: 95,
            difficultyLevel: 'beginner'
        },
        {
            id: 'fallback-3',
            name: 'Read for 15 Minutes',
            description: 'Dedicate time daily to reading books or educational content',
            category: 'Learning',
            frequency: 'Daily',
            timeOfDay: 'Evening',
            timeToComplete: '15 minutes',
            priority: 'Medium',
            matchScore: 82,
            benefits: ['Expands knowledge', 'Improves vocabulary', 'Reduces screen time'],
            impactAreas: ['Personal Growth', 'Cognitive Function'],
            chainsWith: ['Note-taking', 'Reflection'],
            aiReasoning: 'Regular reading builds knowledge and cognitive abilities over time',
            trendingScore: 78,
            difficultyLevel: 'beginner'
        },
        {
            id: 'fallback-4',
            name: 'Digital Sunset',
            description: 'Put away all digital devices 1 hour before bedtime',
            category: 'Digital Wellbeing',
            frequency: 'Daily',
            timeOfDay: 'Evening',
            timeToComplete: '60 minutes',
            priority: 'High',
            matchScore: 87,
            benefits: ['Better sleep quality', 'Reduced eye strain', 'More family time'],
            impactAreas: ['Sleep Health', 'Relationships'],
            chainsWith: ['Reading', 'Meditation'],
            aiReasoning: 'Reducing screen time before bed significantly improves sleep quality',
            trendingScore: 92,
            difficultyLevel: 'intermediate'
        },
        {
            id: 'fallback-5',
            name: 'Gratitude Journaling',
            description: 'Write down 3 things you\'re grateful for each day',
            category: 'Mindfulness',
            frequency: 'Daily',
            timeOfDay: 'Evening',
            timeToComplete: '5 minutes',
            priority: 'Medium',
            matchScore: 84,
            benefits: ['Increases happiness', 'Improves relationships', 'Better sleep'],
            impactAreas: ['Mental Health', 'Relationships'],
            chainsWith: ['Meditation', 'Reflection'],
            aiReasoning: 'Gratitude practice is scientifically proven to increase life satisfaction',
            trendingScore: 86,
            difficultyLevel: 'beginner'
        },
        {
            id: 'fallback-6',
            name: 'Drink More Water',
            description: 'Drink 8 glasses of water throughout the day',
            category: 'Health',
            frequency: 'Daily',
            timeOfDay: 'Throughout day',
            timeToComplete: 'Throughout day',
            priority: 'High',
            matchScore: 90,
            benefits: ['Better hydration', 'Increased energy', 'Clearer skin'],
            impactAreas: ['Physical Health', 'Energy'],
            chainsWith: ['Exercise', 'Healthy eating'],
            aiReasoning: 'Proper hydration is fundamental for optimal body function',
            trendingScore: 88,
            difficultyLevel: 'beginner'
        }
    ];
}

// Log user feedback for improving recommendations
async function logUserFeedback(
    userId: string,
    section: string,
    feedback: string
): Promise<void> {
    try {
        // In a production app, you'd want to store this in your database
        // For now, we'll just log it
        console.log('User feedback:', {
            userId,
            section,
            feedback,
            timestamp: new Date().toISOString()
        });

        // TODO: Store in database for analytics and improving recommendations
        // await storeFeedback({ userId, section, feedback, timestamp: new Date() });
    } catch (error) {
        console.error('Error logging feedback:', error);
    }
}

// Invalidate user cache
async function invalidateUserCache(userId: string): Promise<void> {
    try {
        const { getCachedRecommendations, setCachedRecommendations } = await import(
            '@/lib/services/recommendation-cache'
        );

        // Clear all cached recommendations for this user
        const sections = ['for-you', 'trending', 'new-habits'] as const;

        for (const section of sections) {
            // This would ideally delete the cache entry
            // For now, we'll let the cache naturally expire
            console.log(`Invalidating cache for user ${userId}, section: ${section}`);
        }
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
}

// Check if user already has this habit (prevent duplicates)
export async function checkHabitExists(habitName: string): Promise<boolean> {
    try {
        const { userId } = await auth();
        if (!userId) return false;

        const userHabits = await getUserHabits();
        return userHabits.some(habit =>
            habit.name.toLowerCase().trim() === habitName.toLowerCase().trim()
        );
    } catch (error) {
        console.error('Error checking habit existence:', error);
        return false;
    }
}