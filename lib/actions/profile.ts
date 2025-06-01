// lib/actions/profile.ts
'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongoose';
import { Profile } from '@/lib/models/Profile';
import { Habit } from '@/lib/models/Habit';
import { ChainSession } from '@/lib/models/ChainSession';
import { IProfile } from '@/lib/types';
import { Types, FlattenMaps } from 'mongoose';

type LeanProfile = FlattenMaps<IProfile> & { _id: Types.ObjectId };

export async function getOrCreateProfile(): Promise<IProfile | null> {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return null;
        }

        await connectToDatabase();

        // Try to find existing profile
        let profile = await Profile.findOne({ clerkUserId: userId }).lean<LeanProfile>();

        // If profile exists, update stats before returning
        if (profile) {
            await updateProfileStats();
            profile = await Profile.findOne({ clerkUserId: userId }).lean<LeanProfile>();
        }

        // If no profile exists, create one with Clerk user data
        if (!profile) {
            const newProfileData = {
                clerkUserId: userId,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                userName: user.username || '',
                email: user.emailAddresses[0]?.emailAddress || '',
                bio: '',
                timezone: 'UTC',
                dateFormat: 'MM/DD/YYYY' as const,
                timeFormat: '12h' as const,
                theme: 'system' as const,
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
                    showXP: true,
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
            };

            const newProfile = new Profile(newProfileData);
            await newProfile.save();

            // Fetch the newly created profile to ensure all fields are properly set
            profile = await Profile.findOne({ clerkUserId: userId }).lean<LeanProfile>();
        }

        if (!profile) {
            return null;
        }

        // Ensure XP field exists and has a default value
        const xpField = profile.xp || { total: 0 };

        // Ensure all required fields have default values
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
            notifications: profile.notifications || {
                email: true,
                push: true,
                habitReminders: true,
                weeklyReports: true
            },
            privacy: profile.privacy || {
                profileVisibility: 'private',
                showStreak: true,
                showProgress: true,
                showXP: true,
                showRank: true
            },
            goals: profile.goals || {
                dailyHabitTarget: 3,
                weeklyGoal: 21
            },
            xp: xpField, // Ensure this is always defined
            rank: profile.rank || {
                title: 'Novice',
                level: 1,
                progress: 0
            },
            xpHistory: profile.xpHistory || [],
            groups: profile.groups || [],
            stats: profile.stats || {
                totalHabitsCreated: 0,
                totalCompletions: 0,
                longestStreak: 0,
                totalChainsCompleted: 0,
                dailyBonusesEarned: 0,
                totalGroupsJoined: 0,
                joinedAt: new Date()
            },
            createdAt: profile.createdAt || new Date(),
            updatedAt: profile.updatedAt || new Date()
        };
    } catch (error) {
        console.error('Error getting or creating profile:', error);
        return null;
    }
}

// Add a function to fix existing profiles that might be missing XP
export async function fixMissingXP(): Promise<{ success: boolean; error?: string }> {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        // Update any profile that doesn't have XP field or has null/undefined XP
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

        return { success: true };
    } catch (error) {
        console.error('Error fixing missing XP:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fix XP field'
        };
    }
}

export async function updateProfile(updateData: {
    firstName?: string;
    lastName?: string;
    userName?: string;
    bio?: string;
    timeFormat?: '12h' | '24h';
    theme?: 'light' | 'dark' | 'system' | 'midnight' | 'forest' | 'ocean' | 'sunset' | 'lavender';
}) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                ...updateData,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update profile'
        };
    }
}

export async function updateNotificationSettings(notifications: {
    email: boolean;
    push: boolean;
    habitReminders: boolean;
    weeklyReports: boolean;
}) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                notifications,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update notifications'
        };
    }
}

export async function updatePrivacySettings(privacy: {
    profileVisibility: 'public' | 'private';
    showStreak: boolean;
    showProgress: boolean;
    showXP?: boolean;
    showRank?: boolean;
}) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        // Ensure showXP and showRank have default values if not provided
        const privacyData = {
            ...privacy,
            showXP: privacy.showXP ?? true,
            showRank: privacy.showRank ?? true
        };

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                privacy: privacyData,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update privacy settings'
        };
    }
}

export async function updateGoals(goals: {
    dailyHabitTarget: number;
    weeklyGoal: number;
}) {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                goals,
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating goals:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update goals'
        };
    }
}

export async function updateProfileStats() {
    try {
        const { userId } = await auth();

        if (!userId) {
            throw new Error('User not authenticated');
        }

        await connectToDatabase();

        // Get stats from habits and chain sessions
        const [habits, chainSessions] = await Promise.all([
            Habit.find({ clerkUserId: userId }).lean(),
            ChainSession.find({ clerkUserId: userId, status: 'completed' }).lean()
        ]);

        const totalHabitsCreated = habits.length;
        const totalCompletions = habits.reduce((sum, habit) => {
            return sum + (habit.completions?.filter((c: any) => c.completed).length || 0);
        }, 0);
        const longestStreak = Math.max(...habits.map(habit => habit.streak || 0), 0);
        const totalChainsCompleted = chainSessions.length;

        // Only update the stats fields, NOT the XP fields
        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                $set: {
                    'stats.totalHabitsCreated': totalHabitsCreated,
                    'stats.totalCompletions': totalCompletions,
                    'stats.longestStreak': longestStreak,
                    'stats.totalChainsCompleted': totalChainsCompleted,
                    updatedAt: new Date()
                }
                // Removed the XP fields that were being overwritten
            }
        );

        if (result.matchedCount === 0) {
            throw new Error('Profile not found');
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating profile stats:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update stats'
        };
    }
}