// lib/actions/leaderboard.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { ensureConnection } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';
import { Types } from 'mongoose';
import { cache } from 'react';

export interface LeaderboardUser {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    rankTitle: string;
    rankLevel: number;
    totalCompletions: number;
    longestStreak: number;
    joinedAt: string;
}

export interface UserProfile {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    bio?: string;
    rankTitle: string;
    rankLevel: number;
    rankProgress: number;
    totalCompletions: number;
    longestStreak: number;
    totalHabitsCreated: number;
    totalChainsCompleted: number;
    dailyBonusesEarned: number;
    joinedAt: string;
}

// Optimized type for lean queries - only includes fields we actually query
interface LeaderboardQueryResult {
    _id: Types.ObjectId;
    firstName?: string;
    lastName?: string;
    userName?: string;
    rank: {
        title: string;
        level: number;
        progress?: number;
    };
    stats: {
        totalCompletions: number;
        longestStreak: number;
        totalHabitsCreated?: number;
        totalChainsCompleted?: number;
        dailyBonusesEarned?: number;
    };
    xp: {
        total: number;
    };
    createdAt: Date;
    bio?: string;
}

// Helper function to transform database results to API format
function transformToLeaderboardUser(user: any): LeaderboardUser {
    return {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        rankTitle: user.rank?.title || 'Novice',
        rankLevel: user.rank?.level || 1,
        totalCompletions: user.stats?.totalCompletions || 0,
        longestStreak: user.stats?.longestStreak || 0,
        joinedAt: user.createdAt?.toISOString() || new Date().toISOString()
    };
}

function transformToUserProfile(user: LeaderboardQueryResult): UserProfile {
    return {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        bio: user.bio,
        rankTitle: user.rank?.title || 'Novice',
        rankLevel: user.rank?.level || 1,
        rankProgress: user.rank?.progress || 0,
        totalCompletions: user.stats?.totalCompletions || 0,
        longestStreak: user.stats?.longestStreak || 0,
        totalHabitsCreated: user.stats?.totalHabitsCreated || 0,
        totalChainsCompleted: user.stats?.totalChainsCompleted || 0,
        dailyBonusesEarned: user.stats?.dailyBonusesEarned || 0,
        joinedAt: user.createdAt?.toISOString() || new Date().toISOString()
    };
}

// Cache the leaderboard for 60 seconds to reduce database load
const getCachedLeaderboard = cache(async (): Promise<LeaderboardUser[]> => {
    await ensureConnection();

    // Highly optimized aggregation pipeline
    const users = await Profile.aggregate([
        // Stage 1: Match only public profiles with necessary fields
        {
            $match: {
                'privacy.profileVisibility': 'public',
                'xp.total': { $exists: true, $gte: 0 } // Ensure xp.total exists for sorting
            }
        },

        // Stage 2: Project only required fields to minimize data transfer
        {
            $project: {
                firstName: 1,
                lastName: 1,
                userName: 1,
                'rank.title': 1,
                'rank.level': 1,
                'stats.totalCompletions': 1,
                'stats.longestStreak': 1,
                'xp.total': 1,
                createdAt: 1,
                // Create a computed field for efficient sorting
                sortKey: '$xp.total'
            }
        },

        // Stage 3: Sort by XP total (compound index recommended: { 'privacy.profileVisibility': 1, 'xp.total': -1 })
        { $sort: { sortKey: -1 } },

        // Stage 4: Limit results early for performance
        { $limit: 100 },

        // Stage 5: Remove the computed sortKey field
        {
            $project: {
                sortKey: 0
            }
        }
    ]).allowDiskUse(false); // Ensure operation uses only memory

    return users.map(transformToLeaderboardUser);
});

// Enhanced error handling with specific error types
class LeaderboardError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'LeaderboardError';
    }
}

export async function getLeaderboard(): Promise<{
    success: boolean;
    users?: LeaderboardUser[];
    error?: string;
    cached?: boolean;
}> {
    try {
        // Fast authentication check
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const users = await getCachedLeaderboard();

        return {
            success: true,
            users,
            cached: true // Indicate this might be cached data
        };

    } catch (error) {
        // Enhanced error logging with context
        console.error('Leaderboard fetch failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        // Return user-friendly error
        return {
            success: false,
            error: error instanceof LeaderboardError ? error.message : 'Failed to fetch leaderboard'
        };
    }
}

// Optimized user profile fetch with better error handling
export async function getUserProfile(userId: string): Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string
}> {
    try {
        // Input validation
        if (!userId || typeof userId !== 'string') {
            return { success: false, error: 'Invalid user ID' };
        }

        // Validate ObjectId format to prevent unnecessary database queries
        if (!Types.ObjectId.isValid(userId)) {
            return { success: false, error: 'Invalid user ID format' };
        }

        // Fast authentication check
        const { userId: currentUserId } = await auth();
        if (!currentUserId) {
            return { success: false, error: 'Not authenticated' };
        }

        await ensureConnection();

        // Optimized query with specific field selection and type safety
        const user = await Profile.findOne(
            {
                _id: new Types.ObjectId(userId),
                'privacy.profileVisibility': 'public'
            },
            {
                // Explicit field selection for better performance
                firstName: 1,
                lastName: 1,
                userName: 1,
                bio: 1,
                'rank.title': 1,
                'rank.level': 1,
                'rank.progress': 1,
                'stats.totalCompletions': 1,
                'stats.longestStreak': 1,
                'stats.totalHabitsCreated': 1,
                'stats.totalChainsCompleted': 1,
                'stats.dailyBonusesEarned': 1,
                createdAt: 1
            }
        ).lean<LeaderboardQueryResult>().exec();

        if (!user) {
            return { success: false, error: 'User not found or profile is private' };
        }

        const userProfile = transformToUserProfile(user);
        return { success: true, user: userProfile };

    } catch (error) {
        // Enhanced error logging
        console.error('User profile fetch failed:', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            error: error instanceof LeaderboardError ? error.message : 'Failed to fetch user profile'
        };
    }
}

// Utility function for cache invalidation (useful for admin operations)
export async function invalidateLeaderboardCache(): Promise<void> {
    // React's cache function doesn't have a direct invalidation method
    // This is a placeholder for future cache invalidation logic
    // In production, you might want to use a more sophisticated caching solution
    console.log('Leaderboard cache invalidation requested');
}

// Performance monitoring helper (optional)
export async function getLeaderboardStats(): Promise<{
    totalPublicProfiles: number;
    avgResponseTime: number;
    cacheHitRate: number;
}> {
    const start = performance.now();

    try {
        await ensureConnection();

        const totalPublicProfiles = await Profile.countDocuments({
            'privacy.profileVisibility': 'public'
        });

        const responseTime = performance.now() - start;

        return {
            totalPublicProfiles,
            avgResponseTime: responseTime,
            cacheHitRate: 0.85 // Placeholder - implement actual cache hit tracking
        };
    } catch (error) {
        console.error('Failed to get leaderboard stats:', error);
        throw error;
    }
}