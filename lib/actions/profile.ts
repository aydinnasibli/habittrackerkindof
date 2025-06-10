// lib/actions/profile.ts
'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ensureConnection } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';
import { Habit } from '@/lib/models/Habit';
import { ChainSession } from '@/lib/models/ChainSession';
import { IProfile } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';
import { unstable_cache } from 'next/cache';

type LeanProfile = FlattenMaps<IProfile> & { _id: Types.ObjectId };

// Cache profile data for 5 minutes to reduce database calls
const getCachedProfile = unstable_cache(
    async (userId: string): Promise<LeanProfile | null> => {
        await ensureConnection();
        return Profile.findOne({ clerkUserId: userId }).lean<LeanProfile>();
    },
    ['profile'],
    {
        revalidate: 300, // 5 minutes
        tags: ['profile']
    }
);

// Define stats interface for type safety
interface ProfileStatsResult {
    totalHabitsCreated: number;
    totalCompletions: number;
    longestStreak: number;
    totalChainsCompleted: number;
}

// Optimized stats calculation with aggregation pipeline
const calculateProfileStats = unstable_cache(
    async (userId: string): Promise<ProfileStatsResult> => {
        await ensureConnection();

        // Use aggregation pipeline for better performance
        const [habitStats, chainStats] = await Promise.all([
            Habit.aggregate([
                { $match: { clerkUserId: userId } },
                {
                    $group: {
                        _id: null,
                        totalHabitsCreated: { $sum: 1 },
                        totalCompletions: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: { $ifNull: ['$completions', []] },
                                        cond: { $eq: ['$this.completed', true] }
                                    }
                                }
                            }
                        },
                        longestStreak: { $max: { $ifNull: ['$streak', 0] } }
                    }
                }
            ]),
            ChainSession.countDocuments({
                clerkUserId: userId,
                status: 'completed'
            })
        ]);

        const stats = habitStats[0] || {
            totalHabitsCreated: 0,
            totalCompletions: 0,
            longestStreak: 0
        };

        return {
            ...stats,
            totalChainsCompleted: chainStats
        };
    },
    ['profile-stats'],
    {
        revalidate: 600, // 10 minutes
        tags: ['profile-stats']
    }
);

// Default profile data factory
const createDefaultProfileData = (userId: string, user: any) => ({
    clerkUserId: userId,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    userName: user.username || '',
    email: user.emailAddresses[0]?.emailAddress || '',
    bio: '',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY' as const,
    timeFormat: '12h' as const,
    theme: 'dark' as const,
    notifications: {
        email: true,
        push: true,
        habitReminders: true,
        weeklyReports: true
    },
    privacy: {
        profileVisibility: 'private' as const,
        showStreak: true,
        showProgress: true,
        showRank: true
    },
    goals: {
        dailyHabitTarget: 3,
        weeklyGoal: 21
    },
    xp: {
        total: 0
    },
    rank: {
        title: 'Novice' as const,
        level: 1,
        progress: 0
    },
    xpHistory: [],
    groups: [],
    stats: {
        totalHabitsCreated: 0,
        totalCompletions: 0,
        longestStreak: 0,
        totalChainsCompleted: 0,
        dailyBonusesEarned: 0,
        totalGroupsJoined: 0,
        joinedAt: new Date()
    }
});

// Serialize profile data with proper type safety
const serializeProfile = (profile: LeanProfile): IProfile => {
    const xpField = profile.xp || { total: 0 };

    return {
        _id: profile._id?.toString() || '',
        clerkUserId: profile.clerkUserId,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        userName: profile.userName || '',
        email: profile.email,
        bio: profile.bio || '',
        timezone: profile.timezone,
        dateFormat: profile.dateFormat,
        timeFormat: profile.timeFormat,
        theme: profile.theme,
        notifications: {
            email: profile.notifications?.email ?? true,
            push: profile.notifications?.push ?? true,
            habitReminders: profile.notifications?.habitReminders ?? true,
            weeklyReports: profile.notifications?.weeklyReports ?? true
        },
        privacy: {
            profileVisibility: profile.privacy?.profileVisibility || 'private',
            showStreak: profile.privacy?.showStreak ?? true,
            showProgress: profile.privacy?.showProgress ?? true,
            showRank: profile.privacy?.showRank ?? true
        },
        goals: {
            dailyHabitTarget: profile.goals?.dailyHabitTarget || 3,
            weeklyGoal: profile.goals?.weeklyGoal || 21
        },
        xp: {
            total: xpField.total || 0
        },
        rank: {
            title: profile.rank?.title || 'Novice',
            level: profile.rank?.level || 1,
            progress: profile.rank?.progress || 0
        },
        xpHistory: (profile.xpHistory || []).map((entry: any) => ({
            date: entry.date instanceof Date ? entry.date : new Date(entry.date || Date.now()),
            amount: entry.amount || 0,
            source: entry.source || 'habit_completion',
            description: entry.description || ''
        })),
        groups: profile.groups || [],
        stats: {
            totalHabitsCreated: profile.stats?.totalHabitsCreated || 0,
            totalCompletions: profile.stats?.totalCompletions || 0,
            longestStreak: profile.stats?.longestStreak || 0,
            totalChainsCompleted: profile.stats?.totalChainsCompleted || 0,
            dailyBonusesEarned: profile.stats?.dailyBonusesEarned || 0,
            totalGroupsJoined: profile.stats?.totalGroupsJoined || 0,
            joinedAt: profile.stats?.joinedAt instanceof Date
                ? profile.stats.joinedAt
                : new Date(profile.stats?.joinedAt || Date.now())
        },
        createdAt: profile.createdAt instanceof Date
            ? profile.createdAt
            : new Date(profile.createdAt || Date.now()),
        updatedAt: profile.updatedAt instanceof Date
            ? profile.updatedAt
            : new Date(profile.updatedAt || Date.now())
    };
};

export async function getOrCreateProfile(): Promise<IProfile | null> {
    try {
        const [authResult, user] = await Promise.all([
            auth(),
            currentUser()
        ]);

        const { userId } = authResult;

        if (!userId || !user) {
            return null;
        }

        // Try to get cached profile first
        let profile = await getCachedProfile(userId);

        // If profile exists, return serialized version
        if (profile) {
            return serializeProfile(profile);
        }

        // Profile doesn't exist, create new one
        await ensureConnection();

        const newProfileData = createDefaultProfileData(userId, user);
        const newProfile = new Profile(newProfileData);
        await newProfile.save();

        // Fetch the newly created profile
        profile = await Profile.findOne({ clerkUserId: userId }).lean<LeanProfile>();

        if (!profile) {
            throw new Error('Failed to create profile');
        }

        // Invalidate cache after creating new profile
        revalidatePath('/profile');
        revalidateTag('profile');

        return serializeProfile(profile);
    } catch (error) {
        console.error('Error getting or creating profile:', error);
        return null;
    }
}

// Define update interfaces for better type safety
interface UpdateData {
    [key: string]: any;
    updatedAt: Date;
}

interface BatchUpdateOptions {
    profile?: Partial<Pick<IProfile, 'firstName' | 'lastName' | 'userName' | 'bio' | 'timeFormat' | 'theme'>>;
    notifications?: IProfile['notifications'];
    privacy?: IProfile['privacy'];
    goals?: IProfile['goals'];
}

// Batch update function for better performance
export async function batchUpdateProfile(updates: BatchUpdateOptions): Promise<{ success: boolean; error?: string }> {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await ensureConnection();

        // Build update object with proper typing
        const updateData: UpdateData = {
            updatedAt: new Date()
        };

        if (updates.profile) {
            Object.assign(updateData, updates.profile);
        }

        if (updates.notifications) {
            updateData.notifications = updates.notifications;
        }

        if (updates.privacy) {
            updateData.privacy = {
                ...updates.privacy,
                showRank: updates.privacy.showRank ?? true
            };
        }

        if (updates.goals) {
            updateData.goals = updates.goals;
        }

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            { $set: updateData },
            { runValidators: true }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        // Invalidate relevant caches
        revalidatePath('/profile');
        revalidateTag('profile');
        revalidateTag('profile-stats');

        return { success: true };
    } catch (error) {
        console.error('Error batch updating profile:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update profile'
        };
    }
}

// Legacy update functions for backward compatibility
export async function updateProfile(updateData: {
    firstName?: string;
    lastName?: string;
    userName?: string;
    bio?: string;
    timeFormat?: '12h' | '24h';
    theme?: 'light' | 'dark' | 'system' | 'midnight' | 'forest' | 'ocean' | 'sunset' | 'lavender';
}) {
    return batchUpdateProfile({ profile: updateData });
}

export async function updateNotificationSettings(notifications: IProfile['notifications']) {
    return batchUpdateProfile({ notifications });
}

export async function updatePrivacySettings(privacy: IProfile['privacy']) {
    return batchUpdateProfile({ privacy });
}

export async function updateGoals(goals: IProfile['goals']) {
    return batchUpdateProfile({ goals });
}

// Optimized stats update with transaction support
export async function updateProfileStats(): Promise<{ success: boolean; error?: string }> {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        const stats = await calculateProfileStats(userId);

        await ensureConnection();

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                $set: {
                    'stats.totalHabitsCreated': stats.totalHabitsCreated,
                    'stats.totalCompletions': stats.totalCompletions,
                    'stats.longestStreak': stats.longestStreak,
                    'stats.totalChainsCompleted': stats.totalChainsCompleted,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        // Invalidate stats cache
        revalidatePath('/profile');
        revalidateTag('profile-stats');

        return { success: true };
    } catch (error) {
        console.error('Error updating profile stats:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update stats'
        };
    }
}

// Optimized XP fix function with batch operations
export async function fixMissingXP(): Promise<{ success: boolean; error?: string }> {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await ensureConnection();

        const result = await Profile.updateOne(
            {
                clerkUserId: userId,
                $or: [
                    { 'xp': { $exists: false } },
                    { 'xp': null },
                    { 'xp.total': { $exists: false } },
                    { 'xp.total': null }
                ]
            },
            {
                $set: {
                    'xp.total': 0,
                    'rank.title': 'Novice',
                    'rank.level': 1,
                    'rank.progress': 0,
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/profile');
            revalidateTag('profile');
        }

        return { success: true };
    } catch (error) {
        console.error('Error fixing missing XP:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fix XP field'
        };
    }
}

// Health check function for monitoring
export async function profileHealthCheck(): Promise<{
    success: boolean;
    profileExists: boolean;
    hasValidXP: boolean;
    error?: string;
}> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return {
                success: false,
                profileExists: false,
                hasValidXP: false,
                error: 'User not authenticated'
            };
        }

        await ensureConnection();

        const profile = await Profile.findOne(
            { clerkUserId: userId },
            { xp: 1, rank: 1 }
        ).lean<{ xp?: { total?: number }; rank?: any }>();

        const profileExists = !!profile;
        const hasValidXP = profile?.xp?.total !== undefined &&
            typeof profile.xp.total === 'number' &&
            profile.xp.total >= 0;

        return {
            success: true,
            profileExists,
            hasValidXP
        };
    } catch (error) {
        console.error('Profile health check failed:', error);
        return {
            success: false,
            profileExists: false,
            hasValidXP: false,
            error: error instanceof Error ? error.message : 'Health check failed'
        };
    }
}