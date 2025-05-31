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

        // If no profile exists, create one with Clerk user data
        if (!profile) {
            const newProfile = new Profile({
                clerkUserId: userId,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                userName: user.username || '',
                email: user.emailAddresses[0]?.emailAddress || '',
                timezone: 'UTC',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                theme: 'system',
                notifications: {
                    email: true,
                    push: true,
                    habitReminders: true,
                    weeklyReports: true
                },
                privacy: {
                    profileVisibility: 'private',
                    showStreak: true,
                    showProgress: true
                },
                goals: {
                    dailyHabitTarget: 3,
                    weeklyGoal: 21
                },
                stats: {
                    totalHabitsCreated: 0,
                    totalCompletions: 0,
                    longestStreak: 0,
                    totalChainsCompleted: 0,
                    joinedAt: new Date()
                }
            });

            await newProfile.save();
            profile = await Profile.findOne({ clerkUserId: userId }).lean<LeanProfile>();
        }

        if (!profile) {
            return null;
        }

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
                showProgress: true
            },
            goals: profile.goals || {
                dailyHabitTarget: 3,
                weeklyGoal: 21
            },
            stats: profile.stats || {
                totalHabitsCreated: 0,
                totalCompletions: 0,
                longestStreak: 0,
                totalChainsCompleted: 0,
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

export async function updateProfile(updateData: {
    firstName?: string;
    lastName?: string;
    userName?: string;
    bio?: string;
    timezone?: string;
    dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat?: '12h' | '24h';
    theme?: 'light' | 'dark' | 'system';
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
                privacy,
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

        const result = await Profile.updateOne(
            { clerkUserId: userId },
            {
                'stats.totalHabitsCreated': totalHabitsCreated,
                'stats.totalCompletions': totalCompletions,
                'stats.longestStreak': longestStreak,
                'stats.totalChainsCompleted': totalChainsCompleted,
                updatedAt: new Date()
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